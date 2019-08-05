from flask import Flask, request
import bson
import json
import datetime
app = Flask(__name__)


@app.route("/", methods=["POST"])
def calculate():
    data = request.get_data()
    expr = bson.BSON(data).decode()
    return bson.BSON.encode({
      "ret": str(eval(str(expr['expression'])))
    })

