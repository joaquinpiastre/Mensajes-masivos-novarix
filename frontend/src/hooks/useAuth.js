export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const useAuth = () => {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  return { token, user };
};
