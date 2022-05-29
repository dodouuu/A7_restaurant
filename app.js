// require packages
const express = require('express')
const app = express()

const bodyParser = require('body-parser') // 引用 body-parser
// 用 app.use 規定每一筆請求都需要透過 body-parser 進行前置處理
app.use(bodyParser.urlencoded({ extended: true }))

const Restaurant = require('./models/restaurant') // 引用 Schema 

const exphbs = require('express-handlebars') // 引用 handlebars
// 設定短檔名 hbs
app.engine('hbs', exphbs({ defaultLayout: 'main', extname: '.hbs' }))
app.set('view engine', 'hbs')

const mongoose = require('mongoose') // 載入 mongoose
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }) // 設定連線到 mongoDB
// 取得資料庫連線狀態
const db = mongoose.connection
// 連線異常
db.on('error', () => {
  console.log('mongoDB error!')
})
// 連線成功
db.once('open', () => {
  console.log('mongoDB connected!')
})

// 首頁路由
app.get('/', (req, res) => {
  // load restaurants
  Restaurant.find()
    .lean()
    .then(restaurants => res.render('index', { restaurants }))
    .catch(error => console.error(error))
})

// setting static files
app.use(express.static('public'))

// 新增餐廳頁面的路由
app.get('/restaurants/new', (req, res) => {
  return res.render('new')
})
// 新增餐廳
app.post('/restaurants', (req, res) => {
  Restaurant.create(req.body) // 從 req.body 拿出餐廳各項資料
    .then(() => res.redirect('/'))
    .catch(error => console.log(error))
})

// 顯示餐廳detail頁面的路由
app.get('/restaurants/:id', (req, res) => {
  const id = req.params.id
  return Restaurant.findById(id)
    .lean()
    .then(restaurant => res.render('detail', { restaurant }))
    .catch(error => console.log(error))
})

// 編輯餐廳頁面的路由
app.get('/restaurants/:id/edit', (req, res) => {
  const id = req.params.id
  return Restaurant.findById(id)
    .lean()
    .then(restaurant => res.render('edit', { restaurant }))
    .catch(error => console.log(error))
})
// 更新餐廳資訊
app.post('/restaurants/:id/edit', (req, res) => {
  const id = req.params.id
  const body = req.body
  return Restaurant.findById(id)
    .then(restaurant => {
      restaurant.name = body.name
      restaurant.name_en = body.name_en
      restaurant.category = body.category
      restaurant.image = body.image
      restaurant.location = body.location
      restaurant.phone = body.phone
      restaurant.google_map = body.google_map
      restaurant.rating = body.rating
      restaurant.description = body.description
      return restaurant.save()
    })
    .then(() => res.redirect(`/restaurants/${id}`))
    .catch(error => console.log(error))
})

// 刪除餐廳
app.post('/restaurants/:id/delete', (req, res) => {
  const id = req.params.id
  return Restaurant.findById(id)
    .then(restaurant => restaurant.remove())
    .then(() => res.redirect('/'))
    .catch(error => console.log(error))
})

// 搜尋餐廳
app.get('/search', (req, res) => {
  const originalKeyword = req.query.keyword.trim()
  const lowerCaseKeyword = originalKeyword.toLowerCase()

  Restaurant.find()
    .lean()
    .then(restaurantList => {
      const restaurants = restaurantList.filter(
        restaurant => {
          return restaurant.name.toLowerCase().includes(lowerCaseKeyword) || restaurant.category.toLowerCase().includes(lowerCaseKeyword)
        }
      )
      res.render('index', { restaurants: restaurants, keywords: originalKeyword })
    })

    .catch(error => console.error(error))
})

// start and listen on the Express server
app.listen(3000, () => {
  console.log('App is running on http://localhost:3000')
})