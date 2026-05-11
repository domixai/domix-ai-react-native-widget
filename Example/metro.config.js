const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const packageRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the root directory for the SDK source code, but we will block its node_modules
config.watchFolders = [packageRoot];

// BLOCK the entire root node_modules directory to prevent version conflicts
config.resolver.blockList = [
  new RegExp(path.resolve(packageRoot, 'node_modules').replace(/[/\\\\]/g, '[/\\\\]') + '/.*'),
];

// Force Metro to resolve react-native and react from the Example's node_modules
config.resolver.extraNodeModules = {
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'domix-ai-react-native-widget': packageRoot,
};

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

config.resolver.unstable_enableSymlinks = true;

module.exports = config;
