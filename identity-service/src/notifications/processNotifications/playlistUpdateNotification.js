const moment = require('moment-timezone')
const models = require('../../models')

/**
 * Process playlist update notifications, by upsertion
 * in the DB for each favorited playlist subscriber.
 * @param {Array<Object>} notifications
 * @param {*} tx The DB transcation to attach to DB requests
 */
async function processPlaylistUpdateNotifications(notifications, tx) {
    // type: 'PlaylistUpdate',
    // blocknumber: entry.blocknumber,
    // timestamp: entry.created_at,
    // initiator: entry.playlist_owner_id,
    // metadata: {
    //     entity_id: entry.playlist_id,
    //     entity_type: 'playlist',
    //     playlist_update_timestamp: entry.updated_at,
    //     playlist_update_users: [1,2,3]
    // }

    // keep track of last playlist updates for each user that favorited playlists
    // e.g. { user1: { playlist1: <timestamp>, ... }, ... }
    const userPlaylistUpdatesMap = {}
    notifications.forEach(notification => {
        const { metadata } = notification
        const {
            entity_id: playlistId,
            playlist_update_timestamp: playlistUpdatedAt,
            playlist_update_users: userIds,
        } = metadata
        userIds.forEach(userId => {
            if (userPlaylistUpdatesMap[userId]) {
                userPlaylistUpdatesMap[userId][playlistId] = playlistUpdatedAt
            } else {
                userPlaylistUpdatesMap[userId] = { playlistId: playlistUpdatedAt }
            }
        })
    })

    const userIds = Object.keys(userPlaylistUpdatesMap)

    /**
     * map each user id to their wallet and each wallet to its playlist updates
     * filter out updates where lastUpdated < thirty days ago
     * upsert playlist updates based on wallet address
     */
    const userIdsAndWallets = await models.User.findAll({
        attributes: ['id', 'walletAddress'],
        where: {
            id: userIds,
            walletAddress: { [models.Sequelize.Op.ne]: null }
        },
        transaction: tx
    })
    const userWallets = []
    const userIdToWalletsMap = userIdsAndWallets.reduce((accumulator, current) => {
        const walletAddress = current.walletAddress
        userWallets.push(current.walletAddress)
        return {
            ...accumulator,
            [current.id]: walletAddress
        }
    }, {})
    const userWalletsAndPlaylistUpdates = await models.UserEvents.findAll({
        attributes: ['walletAddress', 'playlistUpdates'],
        where: {
            walletAddress: userWallets,
        },
        transaction: tx
    })
    const userWalletToPlaylistUpdatesMap = userWalletsAndPlaylistUpdates.reduce((accumulator, current) => {
        return {
            ...accumulator,
            [current.walletAddress]: recentPlaylistUpdates
        }
    }, {})
    
    const thirtyDaysAgo = moment().utc().subtract(30, 'days').valueOf()
    const now = moment().utc().valueOf()

    userIds.forEach(userId => {
        const walletAddress = userIdToWalletsMap[userId]
        if (!walletAddress) return

        const dbPlaylistUpdates = userWalletToPlaylistUpdatesMap[walletAddress]
        const fetchedPlaylistUpdates = userPlaylistUpdatesMap[userId]
        Object.keys(fetchedPlaylistUpdates).forEach(playlistLibraryItemId => {
            // is the removal here correct?
            if (dbPlaylistUpdates[playlistLibraryItemId]?.userLastViewed < thirtyDaysAgo) {
                delete dbPlaylistUpdates[playlistLibraryItemId]
                return
            }

            const fetchedLastUpdated = moment(fetchedPlaylistUpdates[playlistLibraryItemId]).utc().valueOf()
            dbPlaylistUpdates[playlistLibraryItemId] = {
                userLastViewed: now, // will this work for auto-favorited playlists e.g. on signup?
                ...dbPlaylistUpdates[playlistLibraryItemId],
                lastUpdated: fetchedLastUpdated
            }
        })
        
        await models.UserEvents.upsert({
            walletAddress,
            playlistUpdates: dbPlaylistUpdates
        })
    })

    // todo can the above this be a bulk update?
    // await models.UserEvents.bulkCreate(
    // [...],
    // { updateOnDuplicate: ["walletAddress"] }
    // )
}

module.exports = processPlaylistUpdateNotifications
