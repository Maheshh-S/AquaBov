import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8080", // Change when deploying
});

export default instance;
