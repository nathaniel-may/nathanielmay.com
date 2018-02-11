# nathanielmay.com

## Architecture

Domain: Google  
DNS: AWS Route53  
CDN: AWS CloudFront  
Hosting: AWS S3  

### Google Domains

nathanielmay.com is registered with Google Domains  
Google is configured to use AWS nameservers because Google does not support CNAMES at the apex

Route53 Records:
```
root	A (alias) 	cloudfront
www	A (alias)	root		
```

### CloudFront

Distribution
  - General Settings
    - Alternate Domain Names
      - nathanielmay.com
      - *.nathanielmay.com
    - SSl Cert
      - From AWS ACM
  - Origins
    - S3 Bucket "nathanielmay.com"
  - Behaviors
    - nathanielmay.com
      - http -> https
      - Max TTL, Min TTL, Default TTL = 0 #for deployment purposes only. Will raise significantly.

### ACM

Signed for addresses
```
nathanielmay.com
*.nathanielmay.com
```

Used ACM link from AWS region [us-east-1](https://console.aws.amazon.com/acm/home?region=us-east-1). Certs created in. other regions cannot be imported to CloudFront.

### S3

Buckets
  - nathanielmay.com
    - redirects all traffic to www.nathanielmay.com bucket
  - www.nathanielmay.com
    - root for all other files in this repo



