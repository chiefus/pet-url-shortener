from url_shortener import settings
from django.shortcuts import redirect
from django.http import HttpResponse
from django.http import HttpResponseNotFound
from boto3 import client
import re

dynamodb_client = client('dynamodb')
regexp_string = r"^/[a-zA-Z0-9]{3,10}/{0,1}$"
pattern = re.compile(regexp_string)
dynamodb_table_name = settings.DYNAMODB_TABLE_NAME

def get_long_uri(id):
    id = id.strip('/')
    try:
        get_item_response = dynamodb_client.get_item(
            TableName=dynamodb_table_name,
            Key={
                'id': {'S': id}
            }
        )
        return None if 'Item' not in get_item_response else get_item_response['Item']['uri']['S']
    except Exception as request_exception:
        print(request_exception)  

def url_shortener(request):
        path = request.path
        if not is_path_valid(path):
            return HttpResponse("Invalid Path")
    
        long_url = get_long_uri(path)
        if long_url is None:
            return HttpResponseNotFound("Not Found") 
        return redirect(long_url)

def is_path_valid(path):
    if re.fullmatch(pattern, path):
        return True
    else:
        return False