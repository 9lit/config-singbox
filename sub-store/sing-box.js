const { type, name } = $arguments
const direct_node = {
  tag: 'out_direct',
  type: 'direct',
  udp_fragment: true
}

const outbound_tag = [
  { tag: "🇭🇰 中国香港", rule: /港|hk|hongkong|hong kong|🇭🇰/i },
  { tag: "🇺🇲 美国", rule: /美国|US|🇺🇲/i },
  { tag: "🇹🇼 中国台湾", rule: /台湾|🇹🇼|🇹🇼/i },
  { tag: "🇸🇬 新加坡", rule: /新|🇸🇬|狮城|sg/i },
  { tag: "🇰🇷 韩国", rule: /韩|KR|🇰🇷/i },
  { tag: "🇬🇧 英国", rule: /英国|GB|🇬🇧/i },
  { tag: "♻️ Auto", rule: "" },
]

let select_node = {
  tag: "💯 节点选择",
  type: "selector",
  default: "♻️ Auto",
  outbounds: [
    "out_direct"
  ]
}

const all_node = {
  tag: "🚀 全部节点",
  type: "selector",
  outbounds: [],
}

function complete_node(tag) {
  const compatible_outbound = {
    type: "urltest",
    outbounds: [],
    url: "https://www.gstatic.com/generate_204",
    interval: "3m"
  }
  compatible_outbound.tag = tag
  return compatible_outbound
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
// 添加全部节点
config.outbounds.push(...proxies)

let new_outbound = Array

for (const outbound of outbound_tag) {

  // 获取该出站配置
  new_outbound = complete_node(outbound.tag);

  // 将此出站加入到配置文件中
  config.outbounds.push(new_outbound);

  // 将 匹配到的节点加入到该出站

  config.outbounds.map(i => {

    if (outbound.tag.includes(i.tag)) {
      if (i.tag === "♻️ Auto") {
        i.outbounds.push(...getTags(proxies));
      } else {
        i.outbounds.push(...getTags(proxies, outbound.rule))
      }
    }
  })

  // 如果此 tag 的出站为空，则删除此节点， 若不为空则加入到 节点选择中

  const index = config.outbounds.indexOf(new_outbound)
  if (config.outbounds[index].outbounds.toString() === '') {
    config.outbounds.splice(index, 1)
  } else {
    select_node.outbounds.push(outbound.tag)
  }
}

// 添加本地出站和代理出站
config.outbounds.push(select_node)
config.outbounds.push(direct_node)




// // 如果出站为空，则添加 compatible_outbound默认值为 direct
// config.outbounds.forEach(outbound => {
//   if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
//     if (!compatible) {
//       config.outbounds.push(compatible_outbound)
//       compatible = true
//     }
//     outbound.outbounds.push(compatible_outbound.tag);
//   }
// });


// 如果为 true 则将 override_android_vpn = true
config.route.override_android_vpn = isMobile()

$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}
