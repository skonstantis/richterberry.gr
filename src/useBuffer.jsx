import { useState, useEffect, useRef, useCallback } from 'react';

export function useBuffer(bufferSizeSec, firstMessage) {
  const [buffer, setBuffer] = useState([]);
  const [virtualNow, setVirtualNow] = useState(-Infinity);

  const virtualNowRef = useRef(virtualNow);
  const lastVirtualUpdateRef = useRef(null);

  const tickMs = 100;

  useEffect(() => {
    virtualNowRef.current = virtualNow;
  }, [virtualNow]);

  useEffect(() => {
    let timeoutId;
  
    const tick = () => {
      if (virtualNowRef.current !== -Infinity && lastVirtualUpdateRef.current != null) {
        const elapsed = (performance.now() - lastVirtualUpdateRef.current) / 1000;
  
        setVirtualNow(prev => {
          const newVirtualNow = prev + elapsed;
  
          setBuffer(prevBuffer => {
            const pruned = prevBuffer.filter(
              item => (newVirtualNow - item.timestamp) <= bufferSizeSec
            );
            return pruned.length === prevBuffer.length ? prevBuffer : pruned;
          });
  
          return newVirtualNow;
        });
  
        lastVirtualUpdateRef.current = performance.now();
      }
      timeoutId = setTimeout(tick, tickMs);
    };
  
    lastVirtualUpdateRef.current = performance.now();
    timeoutId = setTimeout(tick, tickMs);
  
    return () => clearTimeout(timeoutId);
  }, [bufferSizeSec]);  

  const addBatch = useCallback((batch, isHistory = false) => {
    if (!Array.isArray(batch) || batch.length === 0) return;

    setBuffer(prevBuffer => {
      const batchLastTimestamp = batch[batch.length - 1].timestamp;
  
      lastVirtualUpdateRef.current = performance.now();
  
      if (isHistory) {
        setVirtualNow(prev => Math.max(prev, batchLastTimestamp));
      } else {
        setVirtualNow(batchLastTimestamp);
      }

      const batchTimestamps = new Set(batch.map(item => item.timestamp));

      const bufferWithoutDuplicates = prevBuffer.filter(
        item => !batchTimestamps.has(item.timestamp)
      );

      const combined = [...bufferWithoutDuplicates, ...batch].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      const pruned = combined.filter(
        item => (batchLastTimestamp - item.timestamp) <= bufferSizeSec
      );

      return pruned;
    });
  }, [bufferSizeSec]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('https://seismologos.shop/buffer');
      if (!response.ok) {
        console.error('Failed to fetch data:', response.statusText);
        return;
      }
      const data = await response.json();
      if (Array.isArray(data.samples)) {
        addBatch(data.samples, true);
      } else {
        console.warn('Invalid response format: no "samples" array');
      }
    } catch (err) {
      console.error('Error fetching buffer data:', err);
    }
  }, [addBatch]);

  useEffect(() => {
    if (firstMessage) {
      fetchHistory();
    }
  }, [firstMessage, fetchHistory]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setBuffer([]);
        setVirtualNow(-Infinity);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    addBatch,
    buffer,
    virtualNow,
  };
}
