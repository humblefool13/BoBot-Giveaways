window.onload = () => {
  if (window.location.href.includes("error")) {
    const para = document.getElementById("text");
    para.innerHTML = "Auth Failed. Go to Discord and start again";
  } else if (window.location.href.includes("code")) {
    const questionMark = window.location.href.indexOf("?");
    const params = window.location.href.slice(questionMark + 6);
    sessionStorage.setItem("discordAccessCode", params);
    const scopes = ['like.read', 'like.write', 'tweet.read', 'tweet.write', 'follows.read', 'follows.write', 'offline.access'].join("%20");
    window.location.href = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=c0NySEZpU19vSWY4bFJYMndLMGg6MTpjaQ&redirect_uri=http://localhost:3000/twitter&scope=${scopes}&state=state&code_challenge=challenge&code_challenge_method=plain`;
  };
};