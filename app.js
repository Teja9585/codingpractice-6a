const express = require('express')

const sqlite3 = require('sqlite3')
const {open} = require("sqlite")
const path  = require('path')

const app = express()
app.use(express.json());
const dbPath = path.join(__dirname,"covid19India.db")
let db =  null 
const initializeDBAndServer = async() => {
    try {
        db = await open({
            filename:dbPath,
            driver:sqlite3.Database,
        });
        app.listen(3000,() =>{
            console.log("Server is Running at https://localhost:3000/")
        })
    }
    catch(error){
        console.log(`DbError:${error.message}`)
        process.exit(1)

    }
}
initializeDBAndServer()



const convertDbToResponseObject = (dbObject) => {
return {
         stateName:dbObject.state_name,
         population:dbObject.population,
        districtId:dbObject.districtId,
        districtName:dbObject.districtName,
        stateId:dbObject.stateId,
        cases:dbObject.cases,
        cured:dbObject.cured,
         active:dbObject.active,
        deaths:dbObject.deaths
     }
 };


//API-1 Returns a list of all states in the state table 
app.get("/states/",async(request,response) => {
    const  allStateList = `
    SELECT * FROM state ORDER BY state_id;`;

 const stateList = await db.all(allStateList);
 const stateResult = stateList.map((eachObject) => {
     return convertDbToResponseObject(eachObject);
 });
 response.send(stateResult)
 });

 //API-2 Returns a state based on the state ID 
app.get('/states/:stateId/', async(request,response)=> {
    const {stateId} = request.params 
    const getState = `
    SELECT * FROM state WHERE state_id = ${stateId}`
    const newState = await db.get(getState);
    const stateResult = convertDbToResponseObject(newState) 
    response.send(stateResult)
})

//API-3Create a district in the district table, `district_id` is auto-incremented
app.post('/districts/', async(request,response)=> {
    const newDistrict = request.body;
    const {districtName,stateId,cases,cured,active,deaths} = newDistrict;

    const newDistrictPostQuery = `
    INSERT INTO district
    (district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',
    '${stateId}','${cases}', '${cured}', '${active}', '${deaths}')`
    const dbResponse = await db.run(newDistrictPostQuery)
    const newDistrictDetails = dbResponse.lastId 
    response.send('District Successfully Added')
})

//API-4 Returns a district based on the district ID 
app.get("/districts/:districtId/",async(request, response)=> {
    const {districtId} = request.params;
    const districtDetails = `
    SELECT * FROM district WHERE district_id = ${districtId}`; 
    const districtArray = await db.get(districtDetails )
    response.send(convertDbToResponseObject(districtArray))




})
//API-5 Deletes a district from the district table based on the district ID 
app.delete('/districts/:districtId/',async(request,response) =>{
 const {districtId} =  request.params 
 const deleteDistrict = `
 DELETE from district 
 where district_id = ${districtId};`;
 await db.run(deleteDistrict )
 response.send('District Removed')
})
// API-6 Updates the details of a specific district based on the district ID
app.put('/districts/:districtId/',async(request,response) => {
    const {districtId} =  request.params;
    const districtDetails = request.body;  
    const {districtName,
        stateId,
        cases,
        cured,
        active,
        deaths,} = districtDetails; 
    const updateDistrict = `
    UPDATE 
    district
    SET 
         district_name = '${districtName}',
         state_id = ${stateId},
         cases = ${cases},
         cured = ${cured},
         active = ${active},
         deaths = ${deaths}
         
         WHERE district_id = ${districtId};`;
         await db.run(updateDistrict);
         response.send('District Details  updated')

})