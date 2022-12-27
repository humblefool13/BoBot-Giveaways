window.onload = () => {
  if (window.location.href.includes("error")) {
    let failureDiv = document.getElementsByClassName("failure");
    failureDiv = failureDiv[0];
    failureDiv.style.visibility = "visible";
  } else if (window.location.href.includes("code")) {
    let successDiv = document.getElementsByClassName("success");
    successDiv = successDiv[0];
    successDiv.style.visibility = "visible";
    const questionMark = window.location.href.indexOf("?");
    const params = window.location.href.slice(questionMark).split("&");
    const twitterAccessCode = params[1].slice(5);
    const discordCode = sessionStorage.getItem("discordAccessCode");
    const obj = { 'discordCode': discordCode, 'twitterCode': twitterAccessCode };
    fetch('http://37.59.71.137:3000/post', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(obj),
    }).then((res) => {
      console.log(res.status);
    });
  };
};