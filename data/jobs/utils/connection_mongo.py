import base64

import certifi
import pymongo
import json
from data.jobs.utils.environment import binding, mongo_db_uri

# WHEN USING DB CERT #################################

# binding_parsed = json.loads(binding)
#
# mongo_db_uri = binding_parsed['connection']['mongodb']['composed'][0] + "&readPreference=primary&ssl=true"
# mongo_certificate_encoded = binding_parsed['connection']['mongodb']['certificate']['certificate_base64']
#
# cert_decoded = base64.b64decode(mongo_certificate_encoded)
# cert_file = open("certificate.pem", "wb")
# cert_file.write(cert_decoded)
# cert_file.close()
#
# mongo_client = pymongo.MongoClient(
#     mongo_db_uri,
#     tls=True,
#     tlsCAFile="certificate.pem"
# )

# WHEN NOT USING DB CERT #################################

mongo_client = pymongo.MongoClient(mongo_db_uri, tlsCAFile=certifi.where())
