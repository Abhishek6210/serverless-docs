# ServerlessDocs
ServerlessDocs is a Serverless Document Management System I created to showcase the usage of different AWS Services like Cognito, S3, Lambda, API Gateway, etc. 

# Docs
[Still work in progress] Please refer to the full documentation [here](https://dhaval-b-nagar.gitbook.io/serverless-cognito-s3). 

# AWS Services used
- Amazon Cognito (User Pool and Identity Pool)
- AWS Lambda (For Cognito Hooks)
- Amazon S3 (To Host the Frontend and Store Files)
- Amazon Pinpoint (To send outbound emails)
- AWS API Gateway (For Google Sign-In Tokens)
- AWS IAM (Roles, Permissions, etc)

# Caveats
- Front-end needs to be manually pushed with `npm run deploy` command. Reminder, front-end is still a vanilla JS.
- MFA is by enabled by default, will ask to configure after the first login.
- Google Sign-In is optional and by default disabled. Will provide more detail in the docs.
- Some UI glitches :) as expected.
- Documentation is still not complete and some work is in progress.

# Deployment 
The app currently has two deployment setups, 1) Serverless Framework and 2) SAM. The serverless framework is already pushed in the repo and SAM will be pushed soon.

## ServerlessDocs Backend - Serverless Framework
`serverless-docs-backend` folder contains the Serverless backend code and configurations. 

Deploy the backend with `sls deploy --stage ` and use the output variables in `serverless-docs-frontend/app-config.js` file.

## ServerlessDocs Backend - SAM
Updating Soon


# Contributors
I couldn't do it alone :) and glad that I work with AWSome people to help me.

- [Abhishek Desai](https://github.com/AbhishekDesai99)
- [Rahul Ladumor](https://www.linkedin.com/in/rahulladumor/)