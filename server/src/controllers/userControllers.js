export const getUsers = (req, res) => {
  res.json({ message: "Fetching all users" });
};

export const addUser = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  res.status(201).json({ message: `User ${name} added successfully` });
};
