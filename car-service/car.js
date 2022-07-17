"use strict";

const uuid = require("uuid");
const AWS = require("aws-sdk");

AWS.config.setPromisesDependency(require("bluebird"));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.list = (event, context, callback) => {
  var params = {
    TableName: process.env.CAR_TABLE,
    ProjectionExpression: "Name, Year, Origin",
  };

  console.log("Scanning car table.");
  const onScan = (err, data) => {
    if (err) {
      console.log(
        "Scan failed to load data. Error JSON:",
        JSON.stringify(err, null, 2)
      );
      callback(err);
    } else {
      console.log("Scan succeeded.");
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          cars: data.Items,
        }),
      });
    }
  };

  dynamoDb.scan(params, onScan);
};

module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const name = requestBody.name;
  const year = requestBody.year;
  const origin = requestBody.origin;

  if (
    typeof name !== "string" ||
    typeof year !== "string" ||
    typeof origin !== "number"
  ) {
    console.error("Validation Failed");
    callback(new Error("Couldn't submit car because of validation errors."));
    return;
  }

  submitCar(carInfo(name, year, origin))
    .then((res) => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: `Sucessfully submitted car with name ${name}`,
          carId: res.id,
        }),
      });
    })
    .catch((err) => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to submit car with email ${name}`,
        }),
      });
    });
};

const submitCar = (car) => {
  console.log("Submitting car");
  const carInfo = {
    TableName: process.env.CAR_TABLE,
    Item: car,
  };
  return dynamoDb
    .put(carInfo)
    .promise()
    .then((res) => car);
};

const carInfo = (name, year, origin) => {
  return {
    id: uuid.v1(),
    Name: name,
    Miles_per_Gallon: 36,
    Cylinders: 4,
    Displacement: 135,
    Horsepower: 84,
    Weight_in_lbs: 2370,
    Acceleration: 13,
    Year: year,
    Origin: origin,
  };
};
