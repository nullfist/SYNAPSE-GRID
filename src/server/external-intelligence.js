const URLHAUS_RECENT_FILES = 'https://urlhaus-api.abuse.ch/v2/files/exports';

export async function fetchUrlhausSummary() {
  const authKey = process.env.URLHAUS_AUTH_KEY;
  if (!authKey) {
    return {
      enabled: false,
      provider: 'URLhaus abuse.ch',
      message: 'Set URLHAUS_AUTH_KEY to fetch live community threat-intelligence samples.',
      samples: fallbackSamples()
    };
  }

  const response = await fetch(`${URLHAUS_RECENT_FILES}/${authKey}/recent.csv`, {
    headers: {
      'User-Agent': 'SYNAPSE-GRID academic prototype'
    }
  });

  if (!response.ok) {
    return {
      enabled: false,
      provider: 'URLhaus abuse.ch',
      message: `URLhaus request failed with HTTP ${response.status}. Demo fallback is being used.`,
      samples: fallbackSamples()
    };
  }

  const csv = await response.text();
  const samples = parseCsvSamples(csv).slice(0, 8);
  return {
    enabled: true,
    provider: 'URLhaus abuse.ch',
    message: 'Live URLhaus community threat-intelligence samples loaded.',
    samples
  };
}

function parseCsvSamples(csv) {
  return csv
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(',').map((part) => part.replace(/^"|"$/g, '').trim()))
    .filter((columns) => columns.length >= 3)
    .map((columns) => ({
      firstSeen: columns[0],
      sha256: columns[1],
      fileType: columns[2],
      signature: columns[3] || 'unknown'
    }));
}

function fallbackSamples() {
  return [
    {
      firstSeen: 'demo',
      sha256: 'synthetic-threat-sample',
      fileType: 'simulation',
      signature: 'Used only for academic anomaly narrative'
    }
  ];
}
