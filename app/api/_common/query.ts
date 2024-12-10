export async function query(fn: () => any): Promise<any> {
  const resp = await fn();

  if (resp.error) {
    console.log(resp);
    throw new Error("Failed to execute query");
  }

  return resp.data;
}
