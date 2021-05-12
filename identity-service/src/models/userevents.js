'use strict'
module.exports = (sequelize, DataTypes) => {
  const UserEvents = sequelize.define('UserEvents', {
    walletAddress: {
      type: DataTypes.STRING,
      primaryKey: true,
      // should this be 'User' instead of 'Users'?
      // couldn't find a match when I searched for 'models.Users.'
      // and Users does not have a 'walletAddress' attribute
      // and Users model is not defined
      references: { model: 'Users', key: 'walletAddress' }
    },
    needsRecoveryEmail: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    hasSentDownloadAppEmail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    hasSignedInNativeMobile: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    playlistUpdates: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {})

  return UserEvents
}
