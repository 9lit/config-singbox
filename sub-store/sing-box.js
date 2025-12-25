/* 
 引用模板和节点数组
*/

let config = JSON.parse($files[0])
const { type, name } = $arguments
let proxies = await produceArtifact({
  name: 'CDN',
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})
config.outbounds.push(...proxies)


//  dns服务器 标签
const dns_server_tag = {
  dns_proxy: "dns_proxy",
  dns_direct: "dns_direct",
  cloudflare_resolver: "hosts_cloudflare",
  dns_resolver: "ali_resolver",
  hosts_block: "hosts_block"
}

//基本(select, direct, block)，应用分组(selector)以及 国家分组（urltest）标签
const outbound_tag = {
  select: "🔓 魔法上网",
  direct: "🌏 本地出站",
  block: "🚫 广告拦截"
}

const outbound_selector_tag = {
  bilibili: "📺 哔哩哔哩",
  telegram: "✈️ telegram",
  youtube: "▶️ Youtube"
}

const outbound_urltest_tag = {
  hk: { tag: "🇭🇰 中国香港", rule: /港|hk|hongkong|hong kong|🇭🇰/i },
  us: { tag: "🇺🇲 美国", rule: /美国|US|🇺🇲/i },
  tw: { tag: "🇹🇼 中国台湾", rule: /台湾|tw|🇹🇼/i },
  sg: { tag: "🇸🇬 新加坡", rule: /新|🇸🇬|狮城|sg/i },
  kr: { tag: "🇰🇷 韩国", rule: /韩|KR|🇰🇷/i },
  gb: { tag: "🇬🇧 英国", rule: /英国|GB|🇬🇧/i },
  jp: { tag: "🇯🇵 日本", rule: /日本|成田|🇯🇵/i },
  auto: { tag: "♻️ Auto", rule: "" },
}

// outbound 出站模板 selector 和 urltest 类型
const complete_outbound_selector = {
  tag: "",
  type: "selector",
  default: "",
  outbounds: [
    "out_direct"
  ]
}

const complete_outbounds_urltest = {
  tag: "",
  type: "urltest",
  outbounds: [],
  url: "https://www.gstatic.com/generate_204",
  interval: "3m"
}


// dns.riles, route.rules 和 route.rules_set 模板
const compatible_rule_set = {
  type: "remote",
  tag: "",
  format: "binary", // or binary
  url: ""
}

const compatible_rules = {
  rule_set: [],
  action: "route",
  outbound: "",
  server: ""
}


//作用于 rules 和 rule_set
const sing_geosite = "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/"
const ninelit = "https://raw.githubusercontent.com/9lit/config-singbox/rule-set/"


const diversion = {
  bilibili: {
    url: sing_geosite,
    name: "geosite-bilibili@!cn.srs",
  },
  telegram: {
    url: sing_geosite,
    name: "geosite-telegram.srs",
  },
  cn: {
    url: sing_geosite,
    name: "geosite-cn.srs",
  },
  google_play_cn: {
    url: sing_geosite,
    name: "geosite-google-play@cn.srs"
  },
  youtube: {
    url: sing_geosite,
    name: "geosite-youtube.srs"
  },
  adguard: {
    url: ninelit,
    name: "adguard.srs"
  }

}

/**
 * 添加 dns.server dns服务器配置
 */

// 添加 hosts_resolver
let hosts_resolver = {}
hosts_resolver.tag = "hosts_resolver"
hosts_resolver.type = "hosts"
hosts_resolver.path = []
hosts_resolver.predefined = {
  "cloudflare.com": "104.26.12.52",
  localhost: [
    "127.0.0.1",
    "::1",
    "172.18.0.1",
    "fdfe:dcba:9876::1"
  ]
}

// 添加 cloudflare_dns
let cloudflare_dns = {}
cloudflare_dns.tag = dns_server_tag.dns_proxy
cloudflare_dns.type = 'https'
cloudflare_dns.server = "cloudflare-dns.com"
cloudflare_dns.path = "/dns-query"
cloudflare_dns.domain_resolver = dns_server_tag.cloudflare_resolver
cloudflare_dns.detour = outbound_tag.select

// 添加 ali_resolver
let ali_resolver = {}
ali_resolver.tag = dns_server_tag.dns_resolver
ali_resolver.type = 'udp'
ali_resolver.server = "223.5.5.5"

// ali_dns
let ali_dns = {}
ali_dns.tag = dns_server_tag.dns_direct
ali_dns.type = "tls"
ali_dns.server = "dns.alidns.com"
ali_dns.domain_resolver = ali_resolver.tag
ali_dns.detour = outbound_tag.direct

config.dns.servers = []
config.dns.servers.push(cloudflare_dns)
config.dns.servers.push(ali_dns)
config.dns.servers.push(hosts_resolver)
config.dns.servers.push(ali_resolver)

// block_hosts
const block_hosts = {}
block_hosts.tag = dns_server_tag.hosts_block
block_hosts.type = "hosts"
block_hosts.path = []
block_hosts.predefined = {}


// dns.rules 配置
direct_dns_rules = {
  "rule_set": "site-cn",
  "action": "route",
  "server": dns_server_tag.dns_direct
}

block_dns_rules = {
  rule_set: 'adguard',
  action: "route",
  server: dns_server_tag.hosts_block
}

config.dns.rules.push(direct_dns_rules)
config.dns.rules.push(block_dns_rules)

// 配置 默认 dns 服务器
config.dns.final = dns_server_tag.dns_proxy

/**
 * 添加 outbounds 配置
 */

// 获取 select 配置
const select_outbound = JSON.parse(JSON.stringify(complete_outbound_selector));
select_outbound.tag = outbound_tag.select;
select_outbound.default = outbound_urltest_tag.auto

// 添加 urltest 出站配置
for (const urltest_tag in outbound_urltest_tag) {

  const outbounds_urltest = JSON.parse(JSON.stringify(complete_outbounds_urltest));
  outbounds_urltest.tag = outbound_urltest_tag[urltest_tag].tag

  // 将此出站加入到配置文件中
  config.outbounds.push(outbounds_urltest);

  // 按照节点国家进行分组
  config.outbounds.map(node => {
    if (outbound_urltest_tag[urltest_tag].tag.includes(node.tag)) {
      // 如果 匹配到 Auto 则加入全部的节点信息
      if (node.tag === outbound_urltest_tag.auto.tag) {
        node.outbounds.push(...getTags(proxies))
      } else {
        node.outbounds.push(...getTags(proxies, outbound_urltest_tag[urltest_tag].rule))
      }
    }
  })

  // 如果此 tag 的出站为空，则删除此节点， 若不为空则加入到 outbound_tag.out_select
  const index = config.outbounds.indexOf(outbounds_urltest)
  if (config.outbounds[index].outbounds.toString() === '') {
    config.outbounds.splice(index, 1)
  } else {
    select_outbound.outbounds.push(urltest_tag.tag)

  }
}

// 按照应用进行分组， 添加 selector 出站
for (const tag in outbound_selector_tag) {
  const outbound = JSON.parse(JSON.stringify(complete_outbound_selector));
  outbound.outbounds = []
  outbound.tag = outbound_selector_tag[tag]
  delete outbound.default

  config.outbounds.map(node => {

    if (node.type === "urltest") {
      if (["bilibili"].includes(tag)) { if (/中国/i.test(node.tag)) { outbound.outbounds.push(node.tag) } }
      else { if (node.tag !== outbound_urltest_tag.auto) { outbound.outbounds.push(node.tag) } }
    }
  })
  config.outbounds.push(outbound)
}


// 添加 out_direct 和 out_block  以及 select 出站
const block_outbound = {
  tag: outbound_tag.block,
  type: 'block'
}

const direct_outbound = {
  tag: outbound_tag.direct,
  type: 'direct',
  udp_fragment: true
}

config.outbounds.push(block_outbound)
config.outbounds.push(direct_outbound)
config.outbounds.push(select_outbound)


/*
进行 rule-set  rote.rules dns.rules 篇日志
*/

// 初始化 route.rules.direct 配置
const direct_route_rules = JSON.parse(JSON.stringify(compatible_rules));
delete direct_route_rules.server
direct_route_rules.ip_is_private = true
direct_route_rules.domain_suffix = ["1210923.xyz", "dpdns.org"]
direct_route_rules.outbound = outbound_tag.direct

// 初始化 route.rules.block
const block_route_rules = JSON.parse(JSON.stringify(compatible_rules));

// 设置 default_domain_resolver
config.route.default_domain_resolver = dns_server_tag.dns_resolver
// 根据 UA 判断是否为安卓设备。若是则开启 vpn
config.route.override_android_vpn = isMobile()
// 设置 路由的默认出站
config.final = outbound_selector_tag
for (const app in diversion) {
  // route.rule-set 配置
  const rule_set = JSON.parse(JSON.stringify(compatible_rule_set));
  rule_set.tag = "site-" + app.replace(/_/g, "-");
  rule_set.url = diversion[app].url + diversion[app].name
  config.route.rule_set.push(rule_set)

  // route.rules 配置
  const route_rules = JSON.parse(JSON.stringify(compatible_rules));
  delete route_rules.server
  route_rules.rule_set.push(rule_set.tag)
  if (/cn/i.test(app)) {
    // 如果是国内ip 则添加到 route.rules.direct， 并等待循环结束后添加到 config.route.rules
    direct_route_rules.rule_set.push(rule_set.tag)
  } else if (/ad/i.test(app)) {
    block_route_rules.rule_set.push(rule_set.tag)
    block_route_rules.action = 'reject'
    block_route_rules.outbound = outbound_tag.block
  }
  else {
    // 如果不是国内 ip 则根据标签 outbound_selector_tag 添加到 出站， 并直接推送到 config.route.rules
    route_rules.outbound = outbound_selector_tag[app];
    config.route.rules.push(route_rules)
  }
}

// route.rules.direct 配置
config.route.rules.push(direct_route_rules)

// route.rules.block 配置
config.route.rules.push(block_route_rules)

// experimental.clash_api.external_ui_download_detour
config.experimental.clash_api.external_ui_download_detour = outbound_tag.select

// JSON
$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
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