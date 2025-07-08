import { useState, useCallback, useEffect } from 'react';

export function useBuffer(bufferSizeSec, firstMessage) {
  const [buffer, setBuffer] = useState([]);
  const [virtualNow, setVirtualNow] = useState(-Infinity);

  const addBatch = useCallback((batch) => {
    if (!Array.isArray(batch) || batch.length === 0) return;
  
    setBuffer((prevBuffer) => {
      const batchLastTimestamp = batch[batch.length - 1].timestamp;
  
      setVirtualNow((prevVirtualNow) => Math.max(prevVirtualNow, batchLastTimestamp));
  
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
        addBatch(data.samples);
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
  }, [firstMessage]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setBuffer([]);
        setVirtualNow(-Infinity);
      } else if (document.visibilityState === 'visible') {
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    addBatch,
    buffer,
    virtualNow,
  };
}
