const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true, // Packages your app code into an archive for security and speed
    icon: path.join(__dirname, '..', '..', '/assets/icon')
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        options: {
          icon: path.join(__dirname, '..', '..', '/assets/icon.icns')
        }
      }
    },
  ],
};