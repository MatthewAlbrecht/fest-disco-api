module.exports = function(req, res, next) {
   console.log("\n==== We are in the handler for", req.method, req.originalUrl, "====\n")

   if (Object.keys(req.body).length > 0) {
      console.log("== BODY ==\n", req.body)
   }
   next();
}
