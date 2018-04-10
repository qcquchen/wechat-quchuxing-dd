import { checkStatus, getCurrentUser, checkSystemUser } from './utils'
import * as constants from './constants'
const Promise = require('./bluebird')

const requestType = (type, url, options = {}) => {
  const user = getCurrentUser()
  const app  = getApp()

  let jwt_token    = user.jwt_token
  let wx_jwt_token = user.wx_jwt_token

  options.method                 = type
  options.url                    = url
  options.header                 = options.header || {}
  options.header['X-source']     = 'wechat'
  if(!options.header.post_type){
    options.header['Content-Type'] = 'application/json;charset=utf-8;'
  }else{
    options.header['Content-Type'] = 'application/x-www-form-urlencoded;'
  }

  if (wx_jwt_token) {
    options.header['Wx-Authorization'] = wx_jwt_token
  }
  if (jwt_token) {
    options.header['Authorization'] = 'Bearer ' + jwt_token
  }

  function callAPI (resolve, reject) {
    const params = Object.assign({}, options, {
      success (res) {
        if (options.isHiddenError) {
          resolve(res)
        }
        wx.hideLoading()
        console.log(res, '  params')
        checkStatus(Object.assign({}, res, {
          isHideErrorMsg : options.isHideErrorMsg
        })).then(resolve, reject)
      },
      fail (error) {
        reject(error)
      }
    })
    console.log('请求API-=-=-=-',params)
    wx.request(params)
  }


  if (options.login) {
    return new Promise((resolve, reject) => {
      if (options.unLoadLoginCallBack) {
        app.globalData.unloadCallback = options.unLoadLoginCallBack
      }
      checkSystemUser().then(res => {
        if (res == 'toLogin') {
          resolve('toLogin')
          return
        }

        callAPI(resolve, reject)
      }, err => reject(err))
    })
  }

  return new Promise(callAPI)
}

export const _apiPOST = (url, options) => requestType('POST', url, options)

export const _apiGET = (url, options) => requestType('GET', url, options)

export const _apiPUT = (url, options) => requestType('PUT', url, options)

export const _apiDELETE = (url, options) => requestType('DELETE', url, options)

export const api = (options) => {
  return wx.request(options)
}
