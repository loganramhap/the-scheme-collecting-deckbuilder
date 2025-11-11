ion
DoS protectnd DFree SSL a✅ 
- our router on yo be openedd tneeo ports 
- ✅ No internetd t exposeirectlyer d is nev
- ✅ Giteax proxy onlyin through Ng accessibleea API isit- ✅ Ge
flarloudia C vaccessiblepublicly  is 
- ✅ Web app sult**:```

**ReNAL ONLY
0) ← INTERlhost:300caPI (lo─→ Gitea A
      └/dist)der-webappkbuiler/decbuild/www/deck (/variles─→ Static F      ├
      ↓
st:80)x (localho
Ngin ↓er)
     d in containcloudflarere Tunnel (
Cloudfla)
      ↓rotectionSSL, DDoS p Network (dflareou      ↓
Clrs
senternet U
I
```ry
e Summaturrchitec# A

#

---h tunnelougks throgin worh lOAut- [ ] et
 internrectly fromitea dis GCannot accest
- [ ] from internes web app n acces] Ca
- [ flare)oud Cl(provided bySL working 
- [ ] Sdomainrrect th coapp built wieb ted
- [ ] Wpdairect URI uth redy
- [ ] OAuinternallo Gitea g tinx proxyinNS
- [ ] Nge Dflarin Clouded  configurDomaing
- [ ] d and runninlenstalre Tunnel i] Cloudfla [ rewall
-ed in fi block3000
- [ ] Port 3000 127.0.0.1:ing only ontea listen Git

- [ ]cklisity Cheurmplete Sec
## Co---

```

reddflaclourestart temctl syseb
64.dnux-amdudflared-lidpkg -i cloamd64.deb
nux-udflared-linload/clo/dowes/latestlared/releascloudfcloudflare/com/thub.://gitpsh
wget ht``bas
`loudflared## Update c
```

#flared cloudartstemctl re
systl
```bashneestart tun### R -f
```

 cloudflaredrnalctl -ubash
jou```gs
 lo tunnel

### View
```ilderbufo decked tunnel inudflarh
clo
```basustat seltunn View nce

###ntena--

## Mai
-oxy
Nginx prgh hroussible t Only accevate** - pritays **Gitea ss
✅ulex firewall r No compleup** -asy setsed
✅ **Eever expos IP is nur server'Yo- ur IP** yoHide r
✅ **ur serves yoctork protetw neudflare'stion** - Clotec*DDoS proically
✅ *s automat certificates SSLovideflare pr - CloudSL***Free Ser
✅ * routrts on youren pooped to  - No neeeded**ding nwarNo port for

✅ ** Benefits TunnelCloudflare

## 
---DNS
lare  Cloudf cloud) ingeoxied (orans prfy domain ir`
- Veriuildedeckb info tunneldflared us: `clounel statk tune
- Checflartly in Cloud correct upDNS is serify Ve

- ernetintrom  fssacce### Can't d Gitea

an both Nginx rt
- Restainhe domacludes tL ina ROOT_UR Verify Gite`
-lognginx/error.r/log/tail -f /vanx logs: `gieck N

- Chdingloats not Gitea asseinx

### https` in Ngt to ` sed-Proto` is-Forwarde Ensure `Xonfig
-tea crect in Gimain is cort doheck thah app
- CAutn Gitea Oactly i ex URI matchesectedirVerify rls

-  faictedireOAuth r## ed
```

#loudflartart cresmctl el
systetunn
# Restart d -f
dflareu cloulctl -urnad logs
joudflareclo# Check ash
ng

```bonnectiunnel not cng

### Thooti## Troubles


---
ning)
``` (runctiveow: ald sh# Shoudflared
tus cloutactl sning
systemared is runcloudfl. Verify  HTML

# 4urnetuld r Sho000
#alhost:3tp://loc
curl htess worksernal acc3. Test int
# 3000
 rules for w any allow shoould NOT Shgrep 3000
#tatus | fw sort 3000
u p blocksrewall. Verify fi000)

# 2OT 0.0.0.0:3.1:3000 (Nw: 127.0.0 sho
# Shouldep :3000 | grat -tlnpst
netstlocalholistens on y onlea erify Git1. Vsh
# 
```bachecks:
un these tion

RificaSecurity Ver-

## 
--
000`ost:3lhhttp://locaurl ide: `crom ins work fld only  - Shouainer
 he contoutside tork from  w Should NOT -  3000`
ip>:ntainer-<co://httpg: `accessiny  Tr*:
   - accessible*lyblict pu is noeaify Git**Verion

3. uthorizatback after aedirect uld r - ShoGitea
  redirect to  - Should itea"
  n in with Gck "SigCli
   - uth login**: OATestis)

2. **ides thudflare provd SSL (Cloave valiuld he
   - Shogin pagthe lod load - Shoul   
.com`.yourdomainckbuilder://de: `httpsweb app**
1. **Test verything
st ETe## Step 12: 

---

aveack`
6. Sth/callbmain.com/aulder.yourdodeckbui: `https:// URI toate RedirectUpd5. ation
plich ap your OAut. Editications
4 Applttings →
3. Ses adminin a`
2. Sign n.comomaiilder.yourdtps://deckbuin now): `htr domaa (via youGite
1. Go to t URI
irece OAuth Redp 11: Updat-

## Ste``

--x
`oad nginstemctl relnginx -t
syh
``basoad:
`d rel
Test an
```
    }
};
httpsded-Proto rwarFoer X-_set_headxy pro       for;
_forwarded__xddroxy_aor $pForwarded-Fder X-oxy_set_hea       prote_addr;
 em-Real-IP $ret_header X_s   proxy;
     r Host $host_set_headexy        pro:3000;
127.0.0.1ss http://oxy_pa   pr  / {
    /user  location  }

    ;
o httpsotwarded-Pr X-Foreaderroxy_set_h   pr;
     rwarded_foadd_x_foroxy_$pded-For der X-Forwaroxy_set_hea    pr;
    _addrtemoP $reX-Real-Iader set_he      proxy_host;
  st $der Hoet_heaxy_s     pro
   .1:3000;/127.0.0tp:/roxy_pass ht
        poauth/ {tion /login/ca
    lo
    }
_size 50M;bodyax_    client_ms;
    oto httpwarded-Pr X-Forset_header      proxy_;
  rwarded_for_fo_xproxy_addFor $Forwarded-X-et_header proxy_s
        ote_addr;l-IP $remder X-Reaset_hearoxy_ p   host;
    Host $et_header _s   proxy0;
     00.0.0.1:3http://127 proxy_pass 
       i/v1/ {ion /ap)
    locatnternal onlyAPI (iGitea  Proxy   }

    #html;
  dex. $uri/ /in$uriry_files 
        tdist;pp/eba-wilderbuder/deckbuilr/www/deck    root /van / {
    
    locatio web apperve  # S
  ecting-IP;
der CF-Connal_ip_hea  re0/22;
  131.0.72.l_ip_from     set_rea64.0.0/13;
om 172.eal_ip_fr    set_r4;
4.0.0/1p_from 104.2et_real_i s
   .0/13;m 104.16.0frop__real_i    set0/15;
62.158.0.ip_from 1set_real_   17;
 98.41.128.0/from 1t_real_ip_22;
    se.0/2404.7.23_from 19l_iprea;
    set_6.0/2014.9m 188.1l_ip_fro
    set_rea40.0/20;190.93.2_from real_ipset_0/18;
    .192.om 108.162p_frt_real_i  se
  01.64.0/18; 141.1romeal_ip_f
    set_r.31.4.0/22;103l_ip_from    set_rea0.0/22;
 .20m 103.22p_frot_real_i22;
    se3.21.244.0/om 10eal_ip_fr set_r0;
   245.48.0/273._from 1_ipt_realPs
    sedflare I# Trust Clouom;

    in.courdomakbuilder.yr_name dec   serve
 80; listen 
    {rverx
se

```nginblock:erver  the sate
Upd
lder
```ckbuiavailable/dex/sites-nginnano /etc/h

```basflare:
Cloud work with inx todate Ng
Upon
tiguraginx Confiate Nep 10: Upd

## St
```

---udflareds clo statuystemctl```bash
status:

Check sared
```
dflart cloutl sted
systemcflarable cloudsystemctl ene install
red servic
cloudflabash
```ervice:tall as a sIns# .

## a servicep ast und set iss Ctrl+C ares, pf it workr
```

Ideckbuildeel run tunnflared sh
cloudst:
```bat firt il

### Teshe Tunne Start t
## Step 9:
---
d
```
npm run buil

# Rebuild
EOF
comscryfall.://api.L_API=https_SCRYFAL
VITEth/callbackm/aurdomain.coilder.you/deckbuRI=https:/REDIRECT_UVITE__here
ett_secrr_clien_SECRET=youENTGITEA_CLI
VITE_nt_id_hereclieour_D=yENT_IE_GITEA_CLIcom
VITn.r.yourdomaiilde/deckbuhttps:/_URL=EAITE_G
VITenv << 'EOF'
cat > .Update .envapp

# kbuilder-webr/decuildewww/deckbar/
cd /v
```bashomain:
our d to use ypp a the webate

Updgurationpp Confidate Web A 8: Up## Step
---


```
art giteatl rest
systemca:
```bashGite
Restart `
n.com/
``er.yourdomaiuild/deckb https:/ =_URLm
ROOTmain.colder.yourdo deckbuiDOMAIN =r]
`ini
[serve
``es:inte these l``

Updaa/app.ini
`/giteno /etc config
na Edit Giteabash
#``
`ain:
 domur public yoea to use
Update Gituration
itea Config 7: Update G

## Step

---d)range cloud (ooxiestatus**: Pry *Prox
   - *`l.comunneargotNEL_ID>.cf*: `<TUN- **Target*omain)
   for root d `@` r` (oruildee**: `deckb- **Namecord:
   d a CNAME r4. Adings
S sett Go to DNr domain
3.lect youd
2. Seshboarlare Dato Cloudf
1. Go al
 B: Manu
### Option```
domain.com
.yourderer deckbuilildbudns deckunnel route dflared tnnel
clourough the tumain the your doout
# R

```bashded)commentomatic (ReA: Aun 
### Optio
 CloudflareDNS inigure nf6: Co
## Step 
---
al domain
your actum` with n.coer.yourdomai`deckbuildD
- nel Ir actual tunou_ID>` with yUNNELce**:
- `<Tla**Rep
```

:404
EOFttp_statusice: herv)
  - sle (requiredll ruch-a
  # Cat
  :80//localhoste: http:servicin.com
    rdomader.youeckbuile: dtnamx
  - hosn to Nginur domaiyo# Route 
  gress:.json

inTUNNEL_ID>loudflared/<root/.cfile: /tials-
credenkbuilder
tunnel: dec'OF << 'E.ymlonfiged/cdflar > ~/.cloulared

catp ~/.cloudfdir -ash
mkile:

```bg fhe confiate tel

Crenn the Tufigureep 5: Con# St

#---

``bc
`123456789a34-1234--12-1234678 id 12345ilder withdeckbunnel Created tuok like: will lo# It ed
aydisplat's ID thTunnel 
# Note the kbuilder
create decnel dflared tunclour"
ckbuildemed "denel nae a tunsh
# Creat`ba
``nel
a Tun 4: Create Step
## ---
`

em/cert.paredfl`~/.cloudile at  cert freates a

This c```nnel login
d tureon
cloudflanticatiher for autpen a browseThis will oh
# re

```basCloudflaith enticate w Authp 3:

## Ste``

---version
` --aredudfltion
clolanstaly i

# Verif-amd64.debuxred-linloudfla
dpkg -i cl ittalb

# Insux-amd64.deared-linloudfldownload/cs/latest/red/releasere/cloudflaom/cloudfla.cs://githubget httpared
woad cloudflDownl
# 

```bashainer:our LXC conte y
### Insidd)
udflarenel (clore TunCloudflaInstall Step 2: 
---

## 
```
0:3000)0.0.ot 0..1:3000 (n7.0.0ow: 12sh
# Should 000grep :3t -tlnp | host
netsta localonly on's  it

# Verifyrt giteatemctl restaea
syst Gitar

# Restenull || tru 2>/dev/3000/tcpe allow 
ufw deletport 3000ccess to  external alockini

# Bgitea/app.c/.0.1|g' /etR = 127.0HTTP_ADD = .*|HTTP_ADDR 's|d -it
selhos on locasten onlyitea liake Gsh
# M``banually:

` ma

Orrnal.sh
```tea-intesecure-gio/h/t /patipt
bash scrurity seche
# Run tTID>
t enter <Cr
pcnecontai
# Enter `bash``ntainer:

e your co this insid

Runrnal Only)e it Inte (Makcure Gitea: SeStep 1-

## 

--ernet. intthectly from r direnevenx proxy, gih Ne througsibly accesitea is onlty**: G*Securi`

*
``ernal only3000) ← Intt:PI (localhos Atea
└─→ Giatic files) App (steb─→ W
├    ↓ess
 Public acc0) ←alhost:8
Nginx (loc
    ↓ed)(cloudflarunnel  Tudflare
    ↓
Clonet
Intere

```itectur Archy.

##-onlea internalng Gitle keepiTunnel whioudflare t via Clrne to the intedere DeckBuil exposhow toshows uide is guilder

Th for DeckBupnel Setlare Tun# Cloudf