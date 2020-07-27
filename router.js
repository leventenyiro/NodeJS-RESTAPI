var express = require("express")
var router = express.Router()
var controller = require("./controllers/controller")

router.post("/registration", controller.registration)

router.post("/verification", controller.verification)

router.post("/forgotpassword", controller.sendForgotPassword)

router.put("/forgotpassword", controller.forgotPassword)

router.post("/login", controller.login)

router.get("/login", controller.getUser)

router.post("/logout", controller.logout)

router.get("/products", controller.getAll)

router.post("/products", controller.post)

router.get("/products/:id", controller.getOne)

router.put("/products/:id", controller.put)

router.delete("/products/:id", controller.delete)

module.exports = router