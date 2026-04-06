# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## Localstack
Requirements: Pyhton3 and Docker.

In order to use localstack on your local machine you must run: 
  - npm install -g aws-cdk-local aws-cdk
  - pip3 install awscli-local

In order to start localstack:
 - start localstack container with start:localstack script from cdk 
 - deploy resources with the deploy:local script from cdk

## Caveat AMAZON WAF

AMAZON WAF can ***BLOCK*** incoming requests based on a ***set of rules that apply to the WAF***. 

Building on this, WAF has a rule called **AWS#AWSManagedRulesCommonRuleSet#SizeRestrictions_BODY** which will block any incoming calls with body payloads that reach certain size. 

This will trigger an **403 Forbidden** error that looks like a ***CORS*** error on the browser, however it will not be a cors error and if cors is configured correctly and working for other calls, then the WAF should be checked for requests with the status ***BLOCK*** on the target endpoint. If you see the request with ***BLOCK*** then the payload is over the accepted threshold and you found the source of the problem.
