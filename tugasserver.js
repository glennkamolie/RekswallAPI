const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const session = require("express-session");

const app = express();
const port = 3500;

// Create MySQL connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "rekswall",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

// Middleware
app.use(bodyParser.json());
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Routes and other code...

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/api/users", (req, res) => {
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ message: "An error occurred" });
      return;
    }
    res.json(results);
  });
});

// Generate
app.post("/registercostumer", function (req, res) {
  console.log("Menerima GET request/registercostumer");
  let username = { username: req.body.username };
  var nama = { nama: req.body.nama };
  var password = { password: req.body.password };
  //console.log(username, nama, password);
  let sql =
    "INSERT INTO costumers (username, nama, password, saldo, reksadana) VALUES ('" +
    username.username +
    "', '" +
    nama.nama +
    "','" +
    password.password +
    "','0','0')";
  console.log(sql);
  connection.query(sql, function (err, result) {
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ message: "An error occurred" });
      return;
    }
    console.log("1 record inserted");
    console.log(result);
    res.send("berhasil daftar akun");
  });
});

// Login
app.post("/loginrekswall", function (req, res) {
  console.log("Got a POST request");
  let username = req.body.username;
  console.log("Got a Post request data=" + JSON.stringify(username));
  let password = req.body.password;
  console.log("Got a Post request data=" + JSON.stringify(password));
  let saldo = req.body.saldo;
  console.log("Got a Post request data=" + JSON.stringify(saldo));
  let sql =
    "SELECT * FROM costumers WHERE username = '" +
    username +
    "' AND password = '" +
    password +
    "'";
  console.log(sql);
  connection.query(sql, (err, result) => {
    console.log(
      JSON.stringify({
        status: 200,
        error: null,
        response: result,
      })
    );
    if (result != "") {
      req.session.user = { username: username };
      console.log(result);
      const usid = result.map((row) => row.user_id);
      req.session.user_id = usid;
      res.send("Login Berhasil");
    } else {
      res.send("Login Gagal");
    }
  });
});

//Logout
app.get("/logout", (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log("Error destroying session: " + err);
    } else {
      console.log("Session destroyed successfully.");
      // Redirect to the desired page after destroying the session
    }
  });
  console.log(req.session);
  res.send("Logged out Berhasil");
});

//TopUp
app.post("/costumers", function (req, res) {
  console.log("Menerima GET request/costumers");
  let user_id = req.body.user_id;
  var topup_nominal = req.body.topup_nominal;
  var username = req.body.username;
  console.log(user_id)
  let sql1 = "SELECT * FROM costumers WHERE username = '" + username + "'";
  connection.query(sql1, function (err, result) {
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ message: "An error occurred" });
      return;
    }
    console.log("1 record inserted");
    if (result && result.length > 0) {
      let saldo = result[0].saldo;
      let d = parseInt(saldo) + parseInt(topup_nominal); //penjumlahan kalau pengurangan tinggal di -
      let sql =
        "UPDATE `costumers` SET `saldo`='" +
        d +
        "' WHERE username= '" +
        username +
        "'";
      connection.query(sql, function (err, result) {
        if (err) {
          console.error("Error executing MySQL query:", err);
          res.status(500).json({ message: "An error occurred" });
          return;
        }
        console.log(result);
        console.log(err);
        console.log(sql);
        res.send("berhasil topup dana");
      });
    } else {
      res.status(404).json({ message: "No records found" });
    }
  });
});

//realtime reksadana
app.get("/realtime", function (req, res) {
  const SerpApi = require("google-search-results-nodejs");
  const search = new SerpApi.GoogleSearch(
    "627b5ac00aaf29bdc0054ec7f10aa6aa81051a487d64fef5cf12018cf3f791c8"
  );

  const params = {
    engine: "google_finance",
    q: "IDX:XBID", // Batavia IDX30 ETF Index Mutual Fund
  };

  const callback = function (data) {
    console.log(data);
    const futuresChain = data["futures_chain"][0].price;
    let str = futuresChain;
    let num = parseFloat(str.replace(/^[^\d]+/, ""));
    // Lakukan operasi lain yang Anda perlukan dengan data futures_chain

    res.send(num.toFixed(0)); // Kirim data futures_chain sebagai respons
  };

  // Ambil data dari Google Finance API
  search.json(params, callback);
});

//Buy
app.post("/buycostumers", function (req, res) {
  console.log("Menerima GET request/buycostumers");
  var username = req.body.username;
  var buy_reksadana = { buy_reksadana: req.body.buy_reksadana };
  console.log(username);

  // Mengambil saldo saat ini dari database
  connection.query("select * from costumers where username = ?",[username],function(err,result){
    if(err){
      res.status(500).json({ message: "An error occurred" });
    }
      const userId = result[0].user_id;
    if (result && result.length > 0) {
      // Mengambil jumlah reksadana saat ini
      let reksadana = result[0].reksadana;

      // Mengambil harga reksadana dari API
      const SerpApi = require("google-search-results-nodejs");
      const search = new SerpApi.GoogleSearch(
        "627b5ac00aaf29bdc0054ec7f10aa6aa81051a487d64fef5cf12018cf3f791c8"
      );

      const params = {
        engine: "google_finance",
        q: "IDX:XBID", // Batavia IDX30 ETF Index Mutual Fund
      };

      const callback = function (data) {
        console.log(data);
        const futuresChain = data["futures_chain"][0].price;
        let str = futuresChain;
        let num = parseFloat(str.replace(/^[^\d]+/, ""));
        // Lakukan operasi lain yang Anda perlukan dengan data futures_chain

        let hargaReksadana = num.toFixed(0); // Harga reksadana dari API

        // Menghitung jumlah beli reksadana
        let jumlahBeli = parseInt(buy_reksadana.buy_reksadana) / hargaReksadana;

        // Memperbarui saldo dan jumlah reksadana
        let saldoBaru = parseInt(result[0].saldo) - parseInt(buy_reksadana.buy_reksadana);
        let reksadanaBaru = parseInt(reksadana) + jumlahBeli;

        // Memperbarui data pada database
        let sql2 =
          "UPDATE `costumers` SET `saldo`='" +
          saldoBaru +
          "', `reksadana`='" +
          reksadanaBaru +
          "' WHERE user_id= '" +
           +userId+
          "'";
        connection.query(sql2, function (err, result) {
          if (err) {
            console.error("Error executing MySQL query:", err);
            res.status(500).json({ message: "An error occurred" });
            return;
          }
          console.log(result);
          console.log(err);
          console.log(sql2);
          // Insert into
          let sql3 =
            "INSERT INTO history_beli (user_id, total_reksadana_lama, beli_reksadana, total_reksadana_baru, tanggal_transaksi) VALUES ('" + userId +"', '" + reksadana +"', '" + jumlahBeli + "','" + reksadanaBaru + "', NOW())";
            connection.query(sql3, function (err, result2) {
            if (err) {
              console.error("Error executing MySQL query:", err);
              return;
            }
            console.log(result2);
            res.send("berhasil membeli reksadana");
          });
        });
      };

      // Ambil data harga reksadana dari Google Finance API
      search.json(params, callback);
    } else {
      res.status(404).json({ message: "No records found" });
    }
  });
});

//sell
app.post("/sellcostumers", function (req, res) {
  console.log("Menerima POST request/sellcostumers");
  var username = req.body.username;
  var sell_reksadana = { sell_reksadana: req.body.sell_reksadana };
  console.log(username);

  // Mengambil harga reksadana dari API
  const SerpApi = require("google-search-results-nodejs");
  const search = new SerpApi.GoogleSearch(
    "627b5ac00aaf29bdc0054ec7f10aa6aa81051a487d64fef5cf12018cf3f791c8"
  );

  const params = {
    engine: "google_finance",
    q: "IDX:XBID", // Batavia IDX30 ETF Index Mutual Fund
  };

  const callback = function (data) {
    console.log(data);
    const futuresChain = data["futures_chain"][0].price;
    let str = futuresChain;
    let num = parseFloat(str.replace(/^[^\d]+/, ""));
    // Lakukan operasi lain yang Anda perlukan dengan data futures_chain

    let hargaReksadana = num.toFixed(0); // Harga reksadana dari API

    // Mengambil saldo saat ini dari database
    connection.query("select * from costumers where username = ?",[username],function(err,result){
      if(err){
        res.status(500).json({ message: "An error occurred" });
      }
        const userid1 = result[0].user_id;
      if (result && result.length > 0) {
        var saldoku = parseInt(result[0].saldo);
        console.log(saldoku);
        let reksadana = parseFloat(result[0].reksadana);
        // Menghitung hasil jual reksadana
        var jumlahJual = parseFloat(sell_reksadana.sell_reksadana);
        var hasilJual = hargaReksadana * jumlahJual;

        // Memperbarui saldo dan reksadana
        var saldoBaru = parseInt(saldoku) + parseInt(hasilJual);
        console.log(reksadana);
        console.log(hargaReksadana);
        console.log(sell_reksadana);
        console.log(hasilJual);
        let reksadanaBaru = reksadana - jumlahJual;
        console.log(saldoBaru);
        // Memperbarui data pada database
        let sql2 =
          "UPDATE `costumers` SET `saldo`='" +
          saldoBaru +
          "', `reksadana`='" +
          reksadanaBaru +
          "' WHERE user_id= '" +
          userid1 +
          "'";
        connection.query(sql2, function (err, result) {
          if (err) {
            console.error("Error executing MySQL query:", err);
            res.status(500).json({ message: "An error occurred" });
            return;
          }
          console.log(result);
          console.log(sql2);
        });
        // Insert into sell_history
        let sql4 =
          "INSERT INTO history_jual (user_id, total_reksadana_lama, jual_reksadana, total_reksadana_baru, tanggal_transaksi) VALUES ('" + userid1 +"', '" + reksadana + "', '" + jumlahJual + "','" + reksadanaBaru + "', NOW())";
          connection.query(sql4, function (err, result2) {
          if (err) {
            console.error("Error executing MySQL query:", err);
            return;
          }
          console.log(result2);
          res.send("Berhasil menjual reksadana");
        });
      } else {
        res.status(404).json({ message: "No records found" });
      }
    });
  };

  // Ambil data harga reksadana dari Google Finance API
  search.json(params, callback);
});


//Buy History
app.post("/buyhistory", function (req, res) {
  console.log("Menerima GET request/buyhistory");
  let username = req.body.username;
  console.log(username);
  // Mengambil history beli dari database
  let sql = "SELECT user_id FROM costumers WHERE username = '" + username + "'";
  connection.query(sql, function (err, result_userid) {
    console.log(result_userid);
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ message: "An error occurred" });
      return;
    }else{
      console.log(result_userid[0].user_id);
        let sqla = "SELECT * FROM history_beli WHERE user_id = '" + result_userid[0].user_id + "'";
        connection.query(sqla, function (err, result) {
          if (err) {
            console.error("Error executing MySQL query:", err);
            res.status(500).json({ message: "An error occurred" });
            return;
          }

          console.log(result);
          res.json(result); // Send the result as JSON response
    });}
  });
});

//Sell History
app.post("/sellhistory", function (req, res) {
  console.log("Menerima GET request/sellhistory");
  let username = req.body.username;
  // Mengambil history beli dari database
  console.log(username)
  let sql = "SELECT user_id FROM costumers WHERE username = '" + username + "'";
  connection.query(sql, function (err, result_userid) {
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ message: "An error occurred" });
      return;
    }else{
      console.log(result_userid[0].user_id);
        let sqlb = "SELECT * FROM history_jual WHERE user_id = '" + result_userid[0].user_id + "'";
        connection.query(sqlb, function (err, result) {
          if (err) {
            console.error("Error executing MySQL query:", err);
            res.status(500).json({ message: "An error occurred" });
            return;
          }

          console.log(result);
          res.json(result); // Send the result as JSON response
    });}
  });
});

//Jumlah Saldo
app.post("/costumersdana", function (req, res) {
  console.log("Menerima POST request/costumersdana");
  let username = req.body.username;
  console.log(username);
  let sql = "SELECT saldo, reksadana FROM costumers WHERE username = '" + username + "'";
  connection.query(sql, function (err, result) {
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ message: "An error occurred" });
      return;
    }
    console.log(result);
    res.json(result); // Send the result as JSON response
  });
});
