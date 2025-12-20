const { type, name } = $arguments
const compatible_outbound = {
  tag: 'out_direct',
  type: 'direct',
  udp_fragment: true
}

// 判断是否是手机客户端
function isMobile() {
  const userAgentInfo = navigator.userAgent;
  const mobileAgents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
  const mobileFlag = mobileAgents.some((mobileAgent) => {
    return userAgentInfo.indexOf(mobileAgent) > 0;
  });

  return mobileFlag;
}

let compatible
let config = JSON.parse($files[0])

// 获取订阅信息
let proxies = await produceArtifact({
  name: 'CDN',
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

// 修改 outbounds 文件
config.outbounds.push(...proxies)

// 将 tag 为 out_proxy 和 auto 的 outbounds 添加所有代理。
config.outbounds.map(i => {
  if (['out_proxy', 'auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies))
  }
  // if (['hk', 'hk-auto'].includes(i.tag)) {
  //   i.outbounds.push(...getTags(proxies, /港|hk|hongkong|hong kong|🇭🇰/i))
  // }
})

// 如果出站为空，则添加 compatible_outbound默认值为 direct
config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    outbound.outbounds.push(compatible_outbound.tag);
  }
});

// 如果为 true 则将 override_android_vpn = true
config.route.override_android_vpn = isMobile()

$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}