import { Button, Navbar } from "react-daisyui";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <>
      <Navbar className="shadow-lg bg-neutral text-neutral-content rounded-box">
        <Navbar.Start className="px-2 mx-2">
          <span className="text-lg font-bold">Demo-Strike</span>
        </Navbar.Start>

        <Navbar.Center className="px-2 mx-2">
          <div className="flex items-stretch">
            <Link to="/">
              <Button color="ghost">Players</Button>
            </Link>
          </div>
        </Navbar.Center>

        <Navbar.End className="px-2 mx-2"></Navbar.End>
      </Navbar>
    </>
  );
}
