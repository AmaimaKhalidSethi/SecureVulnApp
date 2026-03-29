export const getAppMode = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/mode');
    const data = await res.json();
    return data.currentMode;
  } catch (err) {
    console.error('Failed to fetch mode', err);
    return 'unknown';
  }
};