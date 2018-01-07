module.exports.handleSuccess = function(req, res, message, data) {
   console.log(" ==", message, "==")
   res.json({
      success: true,
      method: req.method,
      endpoint: req.originalUrl,
      message,
      data: data
   })
}
