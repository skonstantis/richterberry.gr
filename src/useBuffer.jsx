import { useReducer, useEffect, useRef, useCallback, useState } from 'react';

const tickMs = 250;

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIRTUAL_NOW':
      return { ...state, virtualNow: action.payload };

      case 'ADD_BATCH': {
        const { batch, bufferSizeSec, isHistory } = action.payload;
        if (!Array.isArray(batch) || batch.length === 0) return state;
      
        let filteredBatch = batch;
        let sampleCounter = state.sampleCounter ?? 0;
      
        console.log(bufferSizeSec);
        if (bufferSizeSec === 300 && !isHistory) {
          // Decimation logic: keep every 5th sample except when value >= 10
          filteredBatch = [];
          for (const item of batch) {
            if (sampleCounter % 5 === 0 || item.value >= 10) {
              filteredBatch.push(item);
            }
            sampleCounter += 1;
          }
        }
      
        if (filteredBatch.length === 0) return state; 
      
        const batchLastTimestamp = filteredBatch[filteredBatch.length - 1].timestamp;
      
        const batchTimestamps = new Set(filteredBatch.map(item => item.timestamp));
        const bufferWithoutDuplicates = state.buffer.filter(
          item => !batchTimestamps.has(item.timestamp)
        );
      
        const combined = [...bufferWithoutDuplicates, ...filteredBatch].sort(
          (a, b) => a.timestamp - b.timestamp
        );
      
        const pruned = combined.filter(
          item => (batchLastTimestamp - item.timestamp) <= bufferSizeSec
        );
      
        const newVirtualNow = isHistory
          ? Math.max(state.virtualNow, batchLastTimestamp)
          : batchLastTimestamp;
      
        return {
          ...state,
          buffer: pruned,
          virtualNow: newVirtualNow,
          sampleCounter: bufferSizeSec === 300 ? sampleCounter : state.sampleCounter, 
        };
      }      

    case 'TICK': {
      const { bufferSizeSec, elapsed } = action.payload;
      const newVirtualNow = state.virtualNow + elapsed;

      const prunedBuffer = state.buffer.filter(
        item => (newVirtualNow - item.timestamp) <= bufferSizeSec
      );

      return {
        virtualNow: newVirtualNow,
        buffer: prunedBuffer,
      };
    }

    case 'CLEAR':
      return { buffer: [], virtualNow: -Infinity };

    default:
      return state;
  }
}

export function useBuffer(bufferSizeSec, firstMessage) {
  const [state, dispatch] = useReducer(reducer, {
    buffer: [],
    virtualNow: -Infinity,
  });
  

  const lastVirtualUpdateRef = useRef(null);
  const [isDocumentVisible, setIsDocumentVisible] = useState(document.visibilityState === 'visible');

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsDocumentVisible(visible);
      if (!visible) {
        dispatch({ type: 'CLEAR' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (state.virtualNow === -Infinity || state.buffer.length === 0 || !isDocumentVisible) {
      return;
    }

    lastVirtualUpdateRef.current = lastVirtualUpdateRef.current || performance.now();

    let timeoutId;

    const tick = () => {
      const now = performance.now();
      const elapsed = (now - lastVirtualUpdateRef.current) / 1000;

      dispatch({ type: 'TICK', payload: { elapsed, bufferSizeSec } });
      lastVirtualUpdateRef.current = now;

      timeoutId = setTimeout(tick, tickMs);
    };

    lastVirtualUpdateRef.current = performance.now();
    timeoutId = setTimeout(tick, tickMs);

    return () => {
      clearTimeout(timeoutId);
      lastVirtualUpdateRef.current = null;
    };
  }, [state.virtualNow, state.buffer.length, isDocumentVisible, bufferSizeSec]);

  const addBatch = useCallback((batch, isHistory = false) => {
    dispatch({
      type: 'ADD_BATCH',
      payload: {
        batch,
        isHistory,
        bufferSizeSec,
      },
    });
  }, [bufferSizeSec]);

  const fetchHistory = useCallback(async () => {
    try {
      console.log(window.location.pathname.replace("/", ""));
      const response = await fetch('https://seismologos.shop/' + window.location.pathname.replace("/", "") + bufferSizeSec);
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

  return {
    addBatch,
    buffer: state.buffer,
    virtualNow: state.virtualNow,
  };
}
