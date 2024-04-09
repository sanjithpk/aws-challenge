# React + TypeScript + Vite

Create a .env file with

```
VITE_AWS_ACCESS_KEY_ID=<your_aws_access_key>
VITE_AWS_SECRET_ACCESS_KEY=<your_aws_secret_access_key>
VITE_AWS_REGION=<your_aws_region>
VITE_S3_BUCKET=fovus-text-store
VITE_INVOKE_URL=<your_invoke_url>
```

Get the API Gateway invoke url in the AWS console for fovus-api

Upload the script.py to s3 using, make sure to change it your desired aws profile. default profile is 'default'

```
node scripts/upload.js
```

Run the development server using

```
npm i
npm run dev
```

Run the production server using

```
npm run build
npm run preview
```
