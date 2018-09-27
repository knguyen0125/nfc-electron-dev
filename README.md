# Electron Vue Template

Uses Electron-Webpack, Electron Builder, Babel 7 and Vue

## Known Issues

### Babel Plugins

Due to how `electron-webpack` creates `babel-loader` for `webpack`, some plugins cannot be configured if installed as devDependencies.

If you wishes to configure Babel plugins, install plugins as dependencies.