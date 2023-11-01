const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser')

//connection to DB
let mongoose = require('mongoose')
const mySecret = process.env['MONGO_URI']
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

//Database scehma

const exerciseShema = new mongoose.Schema({ 
  userid:{ type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});


let userModel = mongoose.model('user', userSchema)
let exerciseModel = mongoose.model('excerise', exerciseShema)
//here start the functions


//here start the API
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//able to add a user
app.post('/api/users',async(req,res)=>{
  let {username}=req.body
  // console.log(username)
  let userObj = new userModel({
    username:req.body.username
  })
  try{
    const user = await userObj.save()
    res.json(user)
  }catch(err){console.log(err)}
})


app.get('/api/users',(req,res)=>{
  userModel.find()
  .then((docs)=>{
    console.log(docs)
    res.send(docs.map((item)=>{
      return({username:item.username,_id:item._id})
    }))
  })
  .catch((err)=>{
    console.error(err)
  })
})

app.get('/api/users/:_id/logs', async (req,res)=>{
  const {from,to,limit} = req.query
  const id=req.params._id;
  const user = await userModel.findById(id)
  if(!user){
    res.send('user not found')
    return
  }else{
    let dateObj = {}
    if(from){
      dateObj["$gte"] = new Date(from)
    }
    if(to){
      dateObj["$lte"] = new Date(from)
    }
    let filter = {
      userid:id
    }

    if(from||to){
      filter.date = dateObj
    }
    const exercises = await exerciseModel.find(filter).limit(+limit??500)
    // res.json(exercise)
    res.json(exercises)

  }

})

//post an excerise
app.post('/api/users/:_id/exercises',async (req,res)=>{
  const id=req.params._id
  const {description,duration,date}=req.body
  try{
    const user = await userModel.findById(id)
    if(!user){
      res.send('cannot find user')
    }else{
      const exerciseObj = new exerciseModel({
        userid:user._id,
        description,
        duration,
        date:date?new Date(date):new Date()
      })
      const exercise = await exerciseObj.save()
      res.json({
        _id:user.id,
        username:user.username,
        description:exercise.description,
        duration:exercise.duration,
        date:new Date(exercise.date).toDateString()
      })
    }
  }catch(err){
    console.log(err)
    res.send('there was an error')
  }
})






//server 
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
