const axios = require('axios')
const fs = require('fs')
const _ = require('lodash')

const cn2Url = 'https://creatornode2.staging.audius.co'
const cn3Url = 'https://creatornode3.staging.audius.co'

const timeout = async function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const hitCNRoute = async function (secondaryUrl, wallet, primary) {
  await axios({
    baseURL: secondaryUrl,
    url: '/sync',
    method: 'post',
    data: {
      wallet: [wallet],
      creator_node_endpoint: primary,
      immediate: true,
      sync_type: 'SIDTESTSYNC'
    }
  })
}

testCN2 = async function () {
  let cn2SecondaryUsers = fs.readFileSync('./cn2.staging.secondaryUsers.txt').toString().split("\n")
  cn2SecondaryUsers = cn2SecondaryUsers.map(cn2User => {
    cn2User = cn2User.split('\t')
    let wallet = cn2User[0]
    let endpoint = cn2User[1]
    let primary = endpoint.split(',')[0]
    return { wallet, primary }
  })
  cn2SecondaryUsers = _.shuffle(cn2SecondaryUsers)

  let counter = 0
  let slice = 500
  for await (const user of cn2SecondaryUsers.slice(0, slice)) {
    console.log(`CN2 || {${new Date()}} {Request #${++counter}} Calling POST ${cn2Url}/sync for wallet ${user.wallet} against primary ${user.primary} ...`)
    await hitCNRoute(cn2Url, user.wallet, user.primary)
    console.log(`{${new Date()}} || 1 sec delay`)
    await timeout(1000)
  }
}

testCN3 = async function () {
  let cn3SecondaryUsers = fs.readFileSync('./cn3.staging.secondaryUsers.txt').toString().split("\n")
  cn3SecondaryUsers = cn3SecondaryUsers.map(cn3User => {
    cn3User = cn3User.split('\t')
    let wallet = cn3User[0]
    let endpoint = cn3User[1]
    let primary = endpoint.split(',')[0]
    return { wallet, primary }
  })
  cn3SecondaryUsers = _.shuffle(cn3SecondaryUsers)

  let counter = 0
  let slice = 500
  for await (const user of cn3SecondaryUsers.slice(0, slice)) {
    console.log(`CN3 || {${new Date()}} {Request #${++counter}} Calling POST ${cn3Url}/sync for wallet ${user.wallet} against primary ${user.primary} ...`)
    await hitCNRoute(cn3Url, user.wallet, user.primary)
    console.log(`{${new Date()}} || 1 sec delay`)
    await timeout(1000)
  }
}

const run = async function () {
  await Promise.all([testCN2(), testCN3()])
}

run()