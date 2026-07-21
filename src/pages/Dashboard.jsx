// import Card from "../components/Card";
import SummaryCard from "../components/SummaryCard";
import { Wallet, TrendingUp, Receipt, PiggyBank } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome Back 👋</h1>

        <p className="text-gray-500">Here's your financial overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Balance" amount="₦300,000" icon={Wallet} />

        <SummaryCard title="Income" amount="₦350,000" icon={TrendingUp} />

        <SummaryCard title="Expenses" amount="₦50,000" icon={Receipt} />

        <SummaryCard title="Savings" amount="₦300,000" icon={PiggyBank} />
      </div>

      {/* <div className="grid grid-cols-3 gap-6">
        {(() => {
          const cards = [
            { title: "Monthly Income", value: "₦350,000" },
            { title: "Savings", value: "₦150,000" },
            { title: "Expenses", value: "₦95,000" },
            { title: "Business Fund", value: "₦60,000" },
          ];

          return cards.map((card, index) => (
            <Card key={index} title={card.title} value={card.value} />
          ));
        })()}
      </div> */}
    </div>
  );
};

export default Dashboard;
