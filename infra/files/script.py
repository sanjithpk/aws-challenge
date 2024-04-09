import boto3
import os

s3_client = boto3.client('s3', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
ec2_client = boto3.client('ec2', region_name='us-east-1')

table_name = 'TextTable'
bucket_name = 'fovus-text-store'

instance_id = os.environ.get('EC2_INSTANCE_ID')
record_id = os.environ.get('RECORD_ID')

table = dynamodb.Table(table_name)
response = table.get_item(Key={'id': record_id})
item = response.get('Item', {})
input_text = item.get('input_text', '')
input_file_path = item.get('input_file_path', '') 

input_file_name = input_file_path.split('/')[-1]

local_input_file_path = f'/tmp/{input_file_name}'
s3_client.download_file(bucket_name, input_file_name, local_input_file_path)

with open(local_input_file_path, 'a') as file:
    file.write(f"\n{input_text}")

output_file_name = f'{record_id}_output.txt'
local_output_file_path = f'/tmp/{output_file_name}'

os.rename(local_input_file_path, local_output_file_path)

s3_client.upload_file(local_output_file_path, bucket_name, output_file_name)

table.update_item(
    Key={'id': record_id},
    UpdateExpression='SET output_file_path = :val1',
    ExpressionAttributeValues={
        ':val1': f's3://{bucket_name}/{output_file_name}'
    }
)

os.remove(local_output_file_path)

print(f"Processed file {output_file_name} successfully.")

if instance_id:
    print(f"Terminating EC2 instance: {instance_id}")
    ec2_client.terminate_instances(InstanceIds=[instance_id])
    print(f"Termination signal sent for EC2 instance: {instance_id}")
else:
    print("EC2 instance ID not provided. Skipping termination.")