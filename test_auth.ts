async function run() {
  try {
    const r = await fetch("http://localhost:5000/api/admin/auth", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: "admin", password: "admin"})
    });
    console.log(r.status);
    console.log(await r.text());
  } catch(e) {
    console.log(e);
  }
}
run();
