import dotenv from "dotenv";
dotenv.config();

import express from "express";

import path from "path";
import { fileURLToPath } from "url"; // Nécessaire pour recréer __dirname
import { engine } from "express-handlebars";

import helpers from "handlebars-helpers";
import handlebars from "handlebars";
helpers(handlebars);

const PORT = process.env.PORT || 4000;

const app = express();

const catchErrors =
  (asyncFunction) =>
  (...args) =>
    asyncFunction(...args).catch(console.error);

const getAllAgents = catchErrors(async () => {
  const res = await fetch("https://valorant-api.com/v1/agents");
  const json = await res.json();
  const agentDetails = json.data.map((agent) => ({
    name: agent.displayName,
  }));
  return agentDetails;
});

const getAgents = catchErrors(async (agentName) => {
  const res = await fetch("https://valorant-api.com/v1/agents");
  const json = await res.json();

  // Trouver l'agent correspondant au nom
  const agent = json.data.find(
    (agent) => agent.displayName.toLowerCase() === agentName.toLowerCase()
  );

  // Vérifier si l'agent a été trouvé
  if (!agent) {
    throw new Error(`Agent with name "${agentName}" not found.`);
  }

  return {
    icon: agent.displayIcon,
    name: agent.displayName,
    role: agent.role ? agent.role.displayName : "role inconnu",
    description: agent.description,
  };
});

// Recréer __dirname
const __filename = fileURLToPath(import.meta.url); // Chemin absolu de ce fichier
const __dirname = path.dirname(__filename); // Répertoire contenant ce fichier

app.use(express.static(path.join(__dirname, "public")));
app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.get(
  "/",
  catchErrors(async (req, res) => {
    const agents = await getAllAgents();
    res.render("home", { agents });
  })
);

app.get(
  "/:agent",
  catchErrors(async (req, res) => {
    const search = req.params.agent;
    const agent = await getAgents(search);
    res.render("agent", { agent });
  })
);

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}.`));
