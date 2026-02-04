import { useQuery } from "@tanstack/react-query";
import { departmentsApi } from "../../services/api/departmentsApi";

function buildTree(flat) {
  const map = new Map();
  flat.forEach((d) => map.set(d.id, { ...d, children: [] }));

  const roots = [];
  map.forEach((node) => {
    if (node.parent_id == null) {
      roots.push(node);
    } else {
      const parent = map.get(node.parent_id);
      if (parent) parent.children.push(node);
      else roots.push(node); // на случай битых parent_id
    }
  });

  const sortRec = (nodes) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);

  return roots;
}

export const useDepartmentsTree = () => {
  return useQuery({
    queryKey: ["departmentsTree"],
    queryFn: async () => {
      const flat = await departmentsApi.getSelect();
      return buildTree(flat);
    },
    staleTime: 5 * 60 * 1000,
  });
};
