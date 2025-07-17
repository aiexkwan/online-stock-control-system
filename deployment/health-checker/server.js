const express = require('express');
const axios = require('axios');
const client = require('prom-client');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 8080;

// Configuration
const config = {
  blueUrl: process.env.BLUE_URL || 'http://newpennine-blue:3000',
  greenUrl: process.env.GREEN_URL || 'http://newpennine-green:3000',
  nginxUrl: process.env.NGINX_URL || 'http://nginx:80',
  checkInterval: parseInt(process.env.CHECK_INTERVAL || '30') * 1000,
  healthEndpoint: process.env.HEALTH_ENDPOINT || '/api/v1/health',
  timeout: parseInt(process.env.TIMEOUT || '10') * 1000
};

// Logging configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/var/log/health-checker.log' })
  ]
});

// Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metrics
const healthCheckGauge = new client.Gauge({
  name: 'health_check_success',
  help: 'Health check success status (1 = success, 0 = failure)',
  labelNames: ['environment', 'endpoint']
});

const responseTimeGauge = new client.Gauge({
  name: 'health_check_response_time_seconds',
  help: 'Health check response time in seconds',
  labelNames: ['environment', 'endpoint']
});

const healthCheckCounter = new client.Counter({
  name: 'health_check_total',
  help: 'Total number of health checks performed',
  labelNames: ['environment', 'endpoint', 'status']
});

const deploymentStatusGauge = new client.Gauge({
  name: 'deployment_status',
  help: 'Current deployment status (1 = active, 0 = inactive)',
  labelNames: ['environment']
});

const errorCounter = new client.Counter({
  name: 'health_check_errors_total',
  help: 'Total number of health check errors',
  labelNames: ['environment', 'error_type']
});

register.registerMetric(healthCheckGauge);
register.registerMetric(responseTimeGauge);
register.registerMetric(healthCheckCounter);
register.registerMetric(deploymentStatusGauge);
register.registerMetric(errorCounter);

// Health check state
let healthState = {
  blue: { healthy: false, lastCheck: null, responseTime: 0 },
  green: { healthy: false, lastCheck: null, responseTime: 0 },
  nginx: { healthy: false, lastCheck: null, responseTime: 0 }
};

// Health check function
async function performHealthCheck(url, environment, endpoint = '') {
  const startTime = Date.now();
  const fullUrl = `${url}${endpoint}`;
  
  try {
    const response = await axios.get(fullUrl, {
      timeout: config.timeout,
      validateStatus: (status) => status < 500
    });
    
    const responseTime = (Date.now() - startTime) / 1000;
    const isHealthy = response.status === 200;
    
    // Update metrics
    healthCheckGauge.set({ environment, endpoint: endpoint || 'root' }, isHealthy ? 1 : 0);
    responseTimeGauge.set({ environment, endpoint: endpoint || 'root' }, responseTime);
    healthCheckCounter.inc({ environment, endpoint: endpoint || 'root', status: isHealthy ? 'success' : 'failure' });
    
    // Update state
    healthState[environment] = {
      healthy: isHealthy,
      lastCheck: new Date(),
      responseTime: responseTime,
      statusCode: response.status
    };
    
    logger.info(`Health check ${isHealthy ? 'passed' : 'failed'}`, {
      environment,
      url: fullUrl,
      responseTime,
      statusCode: response.status
    });
    
    return isHealthy;
    
  } catch (error) {
    const responseTime = (Date.now() - startTime) / 1000;
    
    // Update metrics
    healthCheckGauge.set({ environment, endpoint: endpoint || 'root' }, 0);
    responseTimeGauge.set({ environment, endpoint: endpoint || 'root' }, responseTime);
    healthCheckCounter.inc({ environment, endpoint: endpoint || 'root', status: 'error' });
    errorCounter.inc({ environment, error_type: error.code || 'unknown' });
    
    // Update state
    healthState[environment] = {
      healthy: false,
      lastCheck: new Date(),
      responseTime: responseTime,
      error: error.message
    };
    
    logger.error(`Health check failed`, {
      environment,
      url: fullUrl,
      responseTime,
      error: error.message
    });
    
    return false;
  }
}

// Comprehensive health check
async function runHealthChecks() {
  logger.info('Running comprehensive health checks...');
  
  try {
    // Check blue environment
    const blueHealthy = await performHealthCheck(config.blueUrl, 'blue', config.healthEndpoint);
    
    // Check green environment
    const greenHealthy = await performHealthCheck(config.greenUrl, 'green', config.healthEndpoint);
    
    // Check nginx
    const nginxHealthy = await performHealthCheck(config.nginxUrl, 'nginx', '/health');
    
    // Determine active environment by checking nginx configuration
    await determineActiveEnvironment();
    
    // Additional endpoint checks
    await performEndpointChecks();
    
    // Log overall status
    logger.info('Health check summary', {
      blue: blueHealthy,
      green: greenHealthy,
      nginx: nginxHealthy,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Health check run failed', { error: error.message });
  }
}

// Determine active environment
async function determineActiveEnvironment() {
  try {
    // Check which environment is receiving traffic
    const blueResponse = await axios.get(`${config.blueUrl}/api/v1/metrics`, { timeout: 5000 });
    const greenResponse = await axios.get(`${config.greenUrl}/api/v1/metrics`, { timeout: 5000 });
    
    // Simple heuristic: check response headers or specific metrics
    // This is a placeholder - implement actual logic based on your setup
    const blueActive = blueResponse.status === 200;
    const greenActive = greenResponse.status === 200;
    
    deploymentStatusGauge.set({ environment: 'blue' }, blueActive ? 1 : 0);
    deploymentStatusGauge.set({ environment: 'green' }, greenActive ? 1 : 0);
    
  } catch (error) {
    logger.error('Failed to determine active environment', { error: error.message });
  }
}

// Perform additional endpoint checks
async function performEndpointChecks() {
  const endpoints = [
    '/api/v1/metrics',
    '/api/admin/dashboard',
    '/main-login'
  ];
  
  for (const endpoint of endpoints) {
    await performHealthCheck(config.blueUrl, 'blue', endpoint);
    await performHealthCheck(config.greenUrl, 'green', endpoint);
  }
}

// Database connectivity check
async function checkDatabaseConnectivity() {
  try {
    // Check database through blue environment
    const response = await axios.post(`${config.blueUrl}/api/health/database`, {}, {
      timeout: 10000
    });
    
    const isHealthy = response.status === 200;
    healthCheckGauge.set({ environment: 'database', endpoint: 'connectivity' }, isHealthy ? 1 : 0);
    
    logger.info('Database connectivity check', { healthy: isHealthy });
    
  } catch (error) {
    healthCheckGauge.set({ environment: 'database', endpoint: 'connectivity' }, 0);
    errorCounter.inc({ environment: 'database', error_type: 'connectivity' });
    logger.error('Database connectivity check failed', { error: error.message });
  }
}

// Express routes
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  const overallHealthy = Object.values(healthState).some(state => state.healthy);
  
  res.status(overallHealthy ? 200 : 503).json({
    status: overallHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: healthState
  });
});

// Detailed status endpoint
app.get('/status', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    config: {
      blueUrl: config.blueUrl,
      greenUrl: config.greenUrl,
      nginxUrl: config.nginxUrl,
      checkInterval: config.checkInterval,
      healthEndpoint: config.healthEndpoint
    },
    healthState
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Manual health check trigger
app.post('/check', async (req, res) => {
  const { environment } = req.body;
  
  if (environment && ['blue', 'green', 'nginx'].includes(environment)) {
    let url;
    let endpoint = config.healthEndpoint;
    
    switch (environment) {
      case 'blue':
        url = config.blueUrl;
        break;
      case 'green':
        url = config.greenUrl;
        break;
      case 'nginx':
        url = config.nginxUrl;
        endpoint = '/health';
        break;
    }
    
    const result = await performHealthCheck(url, environment, endpoint);
    
    res.json({
      environment,
      healthy: result,
      timestamp: new Date().toISOString()
    });
  } else {
    await runHealthChecks();
    res.json({
      message: 'Health checks completed',
      timestamp: new Date().toISOString()
    });
  }
});

// Start health check interval
setInterval(runHealthChecks, config.checkInterval);

// Start database connectivity check interval (less frequent)
setInterval(checkDatabaseConnectivity, 60000); // Every minute

// Start server
app.listen(PORT, () => {
  logger.info(`Health checker service started`, {
    port: PORT,
    config
  });
  
  // Run initial health check
  runHealthChecks();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});