# nathanielmay.com

## Architecture

Domain: Google  
DNS: AWS Route53  
CDN: AWS CloudFront  
Hosting: AWS S3  
Email: Gsuites  

### Google Domains

nathanielmay.com is registered with Google Domains  
Google is configured to use AWS nameservers because Google does not support CNAMES at the apex

Route53 Records:
```
A (alias)
	root	cloudfront
	www 	root

MX
	1 ASPMX.L.GOOGLE.COM
	5 ALT1.ASPMX.L.GOOGLE.COM
	5 ALT2.ASPMX.L.GOOGLE.COM
	10 ALT3.ASPMX.L.GOOGLE.COM
	10 ALT4.ASPMX.L.GOOGLE.COM		
```

### CloudFront

Distribution
  - General Settings
    - Alternate Domain Names
      - nathanielmay.com
      - *.nathanielmay.com
    - SSl Cert
      - From AWS ACM
    - Default root object
      - left blank #explicit values prevent s3 bucket redirects
  - Origins
    - S3 Bucket "www.nathanielmay.com"
  - Behaviors
    - www.nathanielmay.com
      - http -> https
      - whitelist Host header #prevents infinite redirects

### ACM

Signed for addresses
```
nathanielmay.com
*.nathanielmay.com
```

Used ACM link from AWS region [us-east-1](https://console.aws.amazon.com/acm/home?region=us-east-1). Certs created in other regions cannot be imported to CloudFront.

### S3

Buckets
  - www.nathanielmay.com
    - redirects all traffic to nathanielmay.com bucket via https
  - nathanielmay.com
    - root for all other files in this repo

### Gsuites

Mail hosting that comes with Google Domains can only be used if Google Name servers are enabled  
Gsuites registers the domain inside Google mail servers  
The MX records in the AWS nameservers direct all mail to Google  
Gsuites costs 5$/user/month  

