module.exports.handleError = function(req, res, message, error) {
   console.log(" ==", message, "==")
   res.json({
      success: false,
      method: req.method,
      endpoint: req.originalUrl,
      message,
      error
   })
}
