import  express  from 'express';
import  fetch from 'node-fetch';
import  redis from 'redis';

const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.PORT || 6379;


const client = redis.createClient(REDIS_PORT);

const app = express();

const setResponse = (username, user_repos) => {
    return `<h2>${username} has ${user_repos} GitHub repos</h2>`
}

const getRepos = async (req, res, next) => {
    try {
        
        const { username } = req.params;

        const response = await fetch(`https://api.github.com/users/${username}`)

        const data = await response.json();
        
        const user_repos = data.public_repos;

        //set data in  Redis
        client.setex(username, 3600, user_repos);

        res.send(setResponse(username, user_repos));

    } catch (error) {
        res.status(500);
    }
}

//Cache Middleware
const cache = (req, res, next) => {
    const { username } = req.params;

    client.get(username, (err, data) => {
        if (err) {
            throw err;
        }
        if (data !== null){
            res.send(setResponse(username, data));
        }else{
            next();
        }
    })
}

app.get('/repos/:username',cache, getRepos)

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});