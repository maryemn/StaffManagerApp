#!/bin/bash
cd /c/Users/naser/StaffManagerApp/src/Frontend
aws s3 sync ./ s3://staffmanagerapp/
echo "Frontend deployed!"
