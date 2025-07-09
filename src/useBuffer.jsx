import { useReducer, useEffect, useRef, useCallback, useState } from 'react';

const tickMs = 100;

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIRTUAL_NOW':
      return { ...state, virtualNow: action.payload };

    case 'ADD_BATCH': {
      const { batch, bufferSizeSec, isHistory } = action.payload;
      if (!Array.isArray(batch) || batch.length === 0) return state;

      const batchLastTimestamp = batch[batch.length - 1].timestamp;

      const batchTimestamps = new Set(batch.map(item => item.timestamp));
      const bufferWithoutDuplicates = state.buffer.filter(
        item => !batchTimestamps.has(item.timestamp)
      );

      const combined = [...bufferWithoutDuplicates, ...batch].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      const pruned = combined.filter(
        item => (batchLastTimestamp - item.timestamp) <= bufferSizeSec
      );

      const newVirtualNow = isHistory
        ? Math.max(state.virtualNow, batchLastTimestamp)
        : batchLastTimestamp;

      return {
        buffer: pruned,
        virtualNow: newVirtualNow,
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

    return () => clearTimeout(timeoutId);
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

  return {
    addBatch,
    buffer: state.buffer,
    virtualNow: state.virtualNow,
  };
}
