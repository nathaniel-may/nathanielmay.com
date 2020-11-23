# nathanielmay.com

## Components

Domain: Google
Hosting, CDN, Certs and Name Servers: Netlify
Email: Gsuites
Code: Github

### Making Changes

Netlify is set up to [preview deploy](https://app.netlify.com/sites/goofy-sinoussi-dd0461/deploys) every branch on the project. This does not consume any limits on their free tier as of Nov 2020. Pushing to master updates nathanielmay.com publicly.

### DNS

nathanielmay.com is registered with Google Domains  
Google is configured to use Netlify nameservers because Google does not support CNAMES at the apex

Route53 Records:
```
Netlify (type of record similar to alias)
	root	goofy-sinoussi-dd0461.netlify.com
	www 	goofy-sinoussi-dd0461.netlify.com

MX
	root	1  ASPMX.L.GOOGLE.COM
	root	5  ALT1.ASPMX.L.GOOGLE.COM
	root	5  ALT2.ASPMX.L.GOOGLE.COM
	root	10 ALT3.ASPMX.L.GOOGLE.COM
	root	10 ALT4.ASPMX.L.GOOGLE.COM	

TXT
	git    https://github.com/nathaniel-may	
```

### Gsuites

Mail hosting that comes with Google Domains can only be used if Google Name servers are enabled  
Gsuites registers the domain inside Google mail servers  
The MX records in the Netlify nameservers direct all mail to Google  
Gsuites which costs 5$/user/month  