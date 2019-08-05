from flask import Flask, request
import json
import datetime
app = Flask(__name__)

#del __builtins__['exec']

@app.route("/", methods=["POST"])
def calculate():
    data = request.get_data()
    expr = json.loads(data)


    return json.dumps({
      "ret": str(eval(str(expr['expression'])))
    })

