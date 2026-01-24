

export default function AdminCommunityPage() {
  return (
    <>
      <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Community Page Management</h1>
      </div>
      <div
          className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
      >
          <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                  Editing form for Community Page will be here.
              </h3>
              <p className="text-sm text-muted-foreground">
                  You will be able to manage the content of your website from here.
              </p>
          </div>
      </div>
    </>
  );
}
