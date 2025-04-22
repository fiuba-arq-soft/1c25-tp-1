import { StatsD } from 'hot-shots';

const client = new StatsD({
  host: 'graphite',
  port: 8125,
  prefix: '',
  errorHandler: (err) => {
    console.error('StatsD error:', err);
  }
});

export function getStartTime() {
  return process.hrtime();
}

export function registerResponseTime(metricName, startTime) {
  const [seconds, nanoseconds] = process.hrtime(startTime);
  const durationMs = seconds * 1000 + nanoseconds / 1e6;
  client.timing(`response.${metricName}`, durationMs);
}

export function countSuccess(metricName) {
  client.increment(`counters.${metricName}.success`);
}

export function countError(metricName) {
  client.increment(`counters.${metricName}.error`);
}

export function addVolumeForCurrency(currency, amount) {
  client.increment(`volumen.total.${currency}`, amount);
}

export function addNetVolume(currency, amount) {
  client.gauge(`volumen.neto.${currency}`, amount);
}