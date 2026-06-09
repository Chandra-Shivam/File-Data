"""
Mock data generator for TempOrginate.xlsx
Generates 200,000+ records matching the original schema.
"""
import random
import datetime
import pandas as pd
from faker import Faker

fake = Faker('en_US')
random.seed(42)
Faker.seed(42)

NUM_RECORDS = 200_000
OUTPUT_PATH = '/Users/shivamchandra/Documents/TempOrginate_Mock.xlsx'

# ── Reference pools ──────────────────────────────────────────────────────────

ACCOUNT_TYPES = ['Line of Credit', 'Mortgage', 'Auto Loan', 'Personal Loan', 'Home Equity Loan', 'HELOC']
ACCOUNT_TYPE_WEIGHTS = [0.25, 0.30, 0.20, 0.15, 0.05, 0.05]

DECISIONS = ['Approved', 'Denied', 'Withdrawn', 'Conditionally Approved', 'Pending']
DECISION_WEIGHTS = [0.60, 0.20, 0.10, 0.07, 0.03]

BOOKING_STATUSES = ['BOOKEX', 'BOOKED', 'PENDING', 'CANCELLED', 'FUNDED']
BOOKING_WEIGHTS = [0.35, 0.35, 0.15, 0.10, 0.05]

APPRAISAL_TYPES = ['Full Appraisal', 'Drive-By', 'AVM', 'Desk Review', None]
APPRAISAL_WEIGHTS = [0.30, 0.20, 0.25, 0.15, 0.10]

APPROVING_LOCATIONS = [
    'Market Override', 'Branch', 'Central Processing', 'Regional Office',
    'HQ', 'Remote', 'Digital Channel'
]

INC_VERIF_METHODS = ['W2', 'Tax Returns', 'Pay Stubs', 'Bank Statements', 'Other', 'Verbal', None]
INC_VERIF_WEIGHTS = [0.25, 0.20, 0.25, 0.15, 0.08, 0.04, 0.03]

OCCUPATION_TITLES = [
    'Software Engineer', 'Manager', 'Director', 'Analyst', 'Consultant',
    'Teacher', 'Nurse', 'Physician', 'Attorney', 'Accountant',
    'Sales Representative', 'Administrative Assistant', 'Self-Employed',
    'Retired', 'Business Owner', None
]

LOAN_PURPOSES = [
    'Personal Expenses', 'Home Improvement', 'Debt Consolidation',
    'Education', 'Medical', 'Vehicle Purchase', 'Business', 'Vacation',
    'Wedding', 'Other'
]

LOAN_TERMS = [12, 24, 36, 48, 60, 84, 120, 180, 240, 360]
LOAN_TERM_WEIGHTS = [0.05, 0.08, 0.12, 0.10, 0.20, 0.15, 0.10, 0.08, 0.07, 0.05]

PROGRAMS = [
    'Unsecured (LOC)', 'Secured (LOC)', 'Fixed Rate Mortgage',
    'ARM Mortgage', 'FHA Loan', 'VA Loan', 'Jumbo Loan',
    'Direct Unsecured', 'Auto Standard', 'Auto Lease'
]

PRODUCT_DESCRIPTIONS = [
    'Direct Unsecured', 'Indirect Auto', 'Mortgage Fixed',
    'Mortgage ARM', 'Home Equity', 'HELOC', 'Personal LOC',
    'FHA Mortgage', 'VA Mortgage', 'Jumbo Mortgage'
]

STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

MARKETS = [
    'FL - DADE', 'FL - BROWARD', 'FL - PALM BEACH', 'TX - HARRIS',
    'TX - DALLAS', 'CA - LOS ANGELES', 'CA - SAN DIEGO', 'NY - KINGS',
    'NY - QUEENS', 'IL - COOK', 'GA - FULTON', 'WA - KING',
    'AZ - MARICOPA', 'NV - CLARK', 'CO - DENVER', 'OH - CUYAHOGA',
    'PA - PHILADELPHIA', 'NC - MECKLENBURG', 'VA - FAIRFAX', 'TN - SHELBY'
]

REGIONS = MARKETS[:]

POLICY_EXCEPTIONS = [
    'Override - Waiver of POI NRE', 'Override - DTI Exception',
    'Override - Credit Score Exception', 'Override - LTV Exception',
    'Override - Employment History', None
]
POLICY_WEIGHTS = [0.20, 0.20, 0.15, 0.15, 0.10, 0.20]

POLICY_REASONS = [
    'OTHER MITIGANT (MUST SPECIFY)', 'STRONG COMPENSATING FACTORS',
    'MANAGEMENT OVERRIDE', 'RELATIONSHIP EXCEPTION', 'RISK ACCEPTED', None
]

COLLATERAL_DESCRIPTIONS = [
    'Single Family Residence', 'Condominium', 'Multi-Family',
    'Townhouse', 'Manufactured Home', 'Commercial Property', None
]

PROPERTY_TYPES = [
    'Single Family', 'Condo', 'Townhouse', 'Multi-Family',
    'Manufactured', 'PUD', None
]

OCCUPANCY_CODES = ['PRIMARY', 'SECONDARY', 'INVESTMENT', None]

RESIDENCE_TYPES = ['Own', 'Rent', 'With Family', 'Other', None]

CLIENT_STATUSES = ['MASS CONSUMER', 'PREMIER', 'WEALTH', 'SMALL BUSINESS', 'CORPORATE']
CLIENT_WEIGHTS = [0.50, 0.25, 0.10, 0.10, 0.05]

LIEN_POSITIONS = [1, 2, None]
LIEN_POSITION_WEIGHTS = [0.60, 0.30, 0.10]

COST_CENTERS = ['3320', '3321', '3322', '3400', '3401', '3500', '3501', '4100', '4200', '4300']

# Officer/Staff pool
def make_officer_pool(n=200):
    pool = []
    for _ in range(n):
        pool.append({
            'id': str(random.randint(10000, 99999)),
            'name': fake.name().upper()
        })
    return pool

OFFICERS = make_officer_pool(200)
PROCESSORS = [fake.name().upper() for _ in range(100)]
UNDERWRITERS = make_officer_pool(80)

# ── Helper generators ────────────────────────────────────────────────────────

def rand_date(start_year=2023, end_year=2026):
    start = datetime.date(start_year, 1, 1)
    end = datetime.date(end_year, 12, 31)
    delta = (end - start).days
    return start + datetime.timedelta(days=random.randint(0, delta))

def rand_dob():
    """Borrower date of birth (age 21-75)."""
    age = random.randint(21, 75)
    ref = datetime.date(2026, 1, 1)
    return ref - datetime.timedelta(days=age * 365 + random.randint(0, 364))

def rand_ssn():
    return f"{random.randint(0, 999999999):09d}"

def rand_credit_score():
    return random.randint(580, 850)

def rand_income():
    """Income skewed toward middle class."""
    return round(random.lognormvariate(11.0, 0.6), 2)

def rand_amount(min_v=5000, max_v=2_000_000):
    return round(random.uniform(min_v, max_v) / 1000) * 1000

def rand_rate(base=5.0, spread=10.0):
    return round(random.uniform(base, base + spread), 2)

def weighted_choice(choices, weights):
    return random.choices(choices, weights=weights, k=1)[0]

def maybe_none(val, prob_none=0.3):
    return None if random.random() < prob_none else val

# ── Row builder ───────────────────────────────────────────────────────────────

def build_row(i):
    acct_num = f"21{i+1:012d}"
    acct_type = weighted_choice(ACCOUNT_TYPES, ACCOUNT_TYPE_WEIGHTS)
    is_secured = acct_type in ('Mortgage', 'Home Equity Loan', 'HELOC', 'Auto Loan')

    decision = weighted_choice(DECISIONS, DECISION_WEIGHTS)
    booking_status = weighted_choice(BOOKING_STATUSES, BOOKING_WEIGHTS)

    app_number = random.randint(100000, 9999999)

    # Appraisal (only for secured)
    appraisal_type = weighted_choice(APPRAISAL_TYPES, APPRAISAL_WEIGHTS) if is_secured else None
    appraised_value = round(random.uniform(50000, 2000000), 2) if is_secured else None

    # Officer
    officer = random.choice(OFFICERS)
    apr_location = random.choice(APPROVING_LOCATIONS)

    loan_rate = rand_rate(4.5, 15.0)
    apr_actual = maybe_none(round(loan_rate + random.uniform(0, 1.5), 2), 0.4)
    apr_promo = maybe_none(round(random.uniform(0.0, loan_rate - 1), 2), 0.7)
    rate_sheet = round(loan_rate + random.uniform(0, 3), 2)

    # Borrower 1
    b1_dob = rand_dob()
    b1_income = rand_income()
    b1_empl_count = random.choice([1, 2, 3])
    b1_credit = rand_credit_score()
    b1_empl_start = rand_date(1990, 2025)
    b1_employer = fake.company().upper()
    b1_inc_verif = random.choice(['Y', 'N'])
    b1_inc_method = weighted_choice(INC_VERIF_METHODS, INC_VERIF_WEIGHTS)
    b1_len_months = random.randint(0, 11)
    b1_len_years = random.randint(0, 35)
    b1_name = fake.name().upper()
    b1_occupation = maybe_none(random.choice(OCCUPATION_TITLES), 0.15)
    b1_prev_months = maybe_none(random.randint(0, 11), 0.5)
    b1_prev_years = maybe_none(random.randint(0, 20), 0.5)
    b1_self_emp = random.choice([0, 1])
    b1_ssn = rand_ssn()

    # Borrower 2 (often absent)
    has_b2 = random.random() < 0.35
    b2_empl_count = random.choice([0, 1, 2]) if has_b2 else 0
    b2_credit = rand_credit_score() if has_b2 else None
    b2_empl_start = rand_date(1990, 2025) if has_b2 else None
    b2_dob = rand_dob() if has_b2 else None
    b2_employer = fake.company().upper() if has_b2 else None
    b2_income = rand_income() if has_b2 else None
    b2_inc_verif = random.choice(['Y', 'N']) if has_b2 else 'N'
    b2_inc_method = weighted_choice(INC_VERIF_METHODS, INC_VERIF_WEIGHTS) if has_b2 else None
    b2_len_months = random.randint(0, 11) if has_b2 else None
    b2_len_years = random.randint(0, 35) if has_b2 else None
    b2_name = fake.name().upper() if has_b2 else None
    b2_occupation = maybe_none(random.choice(OCCUPATION_TITLES), 0.2) if has_b2 else None
    b2_prev_months = maybe_none(random.randint(0, 11), 0.5) if has_b2 else None
    b2_prev_years = maybe_none(random.randint(0, 20), 0.5) if has_b2 else None
    b2_self_emp = random.choice([0, 1]) if has_b2 else 0
    b2_ssn = rand_ssn() if has_b2 else None

    # Closing officer
    closing_off = random.choice(OFFICERS)

    # LTV / CLTV
    ltv = round(random.uniform(0, 100), 2) if is_secured else 0
    decisioned_cltv = maybe_none(round(random.uniform(ltv - 5, ltv + 5), 2), 0.3)
    contract_cltv = maybe_none(round(random.uniform(ltv - 5, ltv + 5), 2), 0.3) if is_secured else 0

    # Collateral (secured only)
    coll_desc = random.choice(COLLATERAL_DESCRIPTIONS) if is_secured else None
    coll_value = round(random.uniform(50000, 2_000_000), 2) if is_secured else 0
    coll_city = fake.city().upper() if is_secured else None
    coll_county = fake.city().upper() if is_secured else None
    coll_state = random.choice(STATES) if is_secured else None
    coll_addr = fake.street_address().upper() if is_secured else None
    coll_zip = fake.zipcode() if is_secured else None

    cost_center = random.choice(COST_CENTERS)

    # Dates
    date_app = rand_date(2024, 2026)
    date_booked = date_app + datetime.timedelta(days=random.randint(5, 60))
    date_closed = date_app + datetime.timedelta(days=random.randint(1, 30))
    mod_date = maybe_none(date_booked + datetime.timedelta(days=random.randint(1, 30)), 0.7)
    fund_date = date_booked

    annual_income = b1_income + (b2_income or 0)
    monthly_debt = round(annual_income / 12 * random.uniform(0.1, 0.6), 2)
    dti = round((monthly_debt / (annual_income / 12)) * 100, 2) if annual_income > 0 else 0

    employee_loan = 'N' if random.random() > 0.05 else 'Y'
    lien_holder = maybe_none(fake.company().upper(), 0.6) if is_secured else None
    lien_pos = weighted_choice(LIEN_POSITIONS, LIEN_POSITION_WEIGHTS) if is_secured else None
    loan_purpose = random.choice(LOAN_PURPOSES)
    loan_term = weighted_choice(LOAN_TERMS, LOAN_TERM_WEIGHTS)

    base_amount = rand_amount(5000, 1_000_000)
    amt_approved = round(base_amount * random.uniform(0.8, 1.0), 2) if decision == 'Approved' else None
    amt_financed = round(base_amount * random.uniform(0.9, 1.0), 2) if decision == 'Approved' else None
    credit_limit = amt_financed

    program = random.choice(PROGRAMS)

    mailing_addr = fake.street_address().upper()
    mailing_city = fake.city().upper()
    mailing_state = random.choice(STATES)
    mailing_zip = fake.zipcode()

    md_loan = maybe_none(random.choice(['Y', 'N']), 0.8)
    month_key = date_app.month
    year_key = date_app.year

    occupancy = maybe_none(random.choice(OCCUPANCY_CODES), 0.3) if is_secured else None
    market = random.choice(MARKETS)

    originator = random.choice(OFFICERS)
    sales_ref = random.choice(OFFICERS)

    policy_exc = weighted_choice(POLICY_EXCEPTIONS, POLICY_WEIGHTS)
    policy_reason = random.choice(POLICY_REASONS) if policy_exc else None
    pricing_override = maybe_none(random.choice(['Y', 'N']), 0.7)
    pricing_reason = maybe_none(fake.sentence(nb_words=5).upper(), 0.8) if pricing_override == 'Y' else None

    processor = random.choice(PROCESSORS)
    product_desc = random.choice(PRODUCT_DESCRIPTIONS)
    product_num = random.randint(1, 99)

    property_type = random.choice(PROPERTY_TYPES) if is_secured else None
    region = random.choice(REGIONS)
    report_market = maybe_none(random.choice(MARKETS), 0.5)
    residence_type = maybe_none(random.choice(RESIDENCE_TYPES), 0.3)

    total_sale_price = round(random.uniform(10000, 2_000_000), 2) if is_secured else round(base_amount * 1.1, 2)
    total_applicants = 2 if has_b2 else 1

    underwriter = random.choice(UNDERWRITERS)
    decision_date = date_app + datetime.timedelta(days=random.randint(1, 30))
    existing_liens = maybe_none(round(random.uniform(0, 500000), 2), 0.6) if is_secured else None
    client_status = weighted_choice(CLIENT_STATUSES, CLIENT_WEIGHTS)

    return {
        'Account Number': acct_num,
        'Account Type': acct_type,
        'Annual Income': round(annual_income, 2),
        'Application Decision': decision,
        'Booking Status': booking_status,
        'Application Number': app_number,
        'Appraisal Type Name': appraisal_type,
        'Appraised Value': appraised_value,
        'Approving Last Officer Associate ID': officer['id'],
        'Approving Last Officer Location': apr_location,
        'Approving Last Officer Name': officer['name'],
        'APR Actual Rate': apr_actual,
        'Loan Rate': loan_rate,
        'APR Promotional Rate': apr_promo,
        'Rate Sheet Rate': rate_sheet,
        'B1 Employer Count': b1_empl_count,
        'B1 Credit Score': b1_credit,
        'B1 Empl Start Date': datetime.datetime.combine(b1_empl_start, datetime.time()),
        'B1 Date Of Birth': datetime.datetime.combine(b1_dob, datetime.time()),
        'B1 Employer Name': b1_employer,
        'B1 Income': b1_income,
        'B1 Inc Verif Flg': b1_inc_verif,
        'B1 Inc Verif Method': b1_inc_method,
        'B1 Length Employed Months': b1_len_months,
        'B1 Length Employed Years': b1_len_years,
        'B1 Name': b1_name,
        'B1 Occupation Title': b1_occupation,
        'B1 Prev Employ Months': b1_prev_months,
        'B1 Prev Employ Years': b1_prev_years,
        'B1 Self Employed': b1_self_emp,
        'B1 SSN': b1_ssn,
        'B2 Employer Count': b2_empl_count,
        'B2 Credit Score': b2_credit,
        'B2 Empl Start Date': datetime.datetime.combine(b2_empl_start, datetime.time()) if b2_empl_start else None,
        'B2 Date Of Birth': datetime.datetime.combine(b2_dob, datetime.time()) if b2_dob else None,
        'B2 Employer Name': b2_employer,
        'B2 Income': b2_income,
        'B2 Inc Verif Flg': b2_inc_verif,
        'B2 Inc Verif Method': b2_inc_method,
        'B2 Length Employed Months': b2_len_months,
        'B2 Length Employed Years': b2_len_years,
        'B2 Name': b2_name,
        'B2 Occupation Title': b2_occupation,
        'B2 Prev Employ Months': b2_prev_months,
        'B2 Prev Employ Years': b2_prev_years,
        'B2 Self Employed': b2_self_emp,
        'B2 SSN': b2_ssn,
        'Closing Officer Associate ID': int(closing_off['id']),
        'Closing Officer Name': closing_off['name'],
        'LOAN TO VALUE': ltv,
        'DecisionedCLTV': decisioned_cltv,
        'ContractCLTV': contract_cltv,
        'Collateral Description': coll_desc,
        'Collateral Value': coll_value,
        'Collateral City': coll_city,
        'Collateral County': coll_county,
        'Collateral State': coll_state,
        'Collateral Street Address': coll_addr,
        'Collateral Zip': coll_zip,
        'Cost Center Number': cost_center,
        'Date Application': datetime.datetime.combine(date_app, datetime.time()),
        'Date Booked': datetime.datetime.combine(date_booked, datetime.time()),
        'Date Closed': datetime.datetime.combine(date_closed, datetime.time()),
        'Modification Date': datetime.datetime.combine(mod_date, datetime.time()) if mod_date else None,
        'Monthly Debt': monthly_debt,
        'DTI': dti,
        'Employee Loan': employee_loan,
        'Lien Holder': lien_holder,
        'Lien Position': lien_pos,
        'Loan Purpose': loan_purpose,
        'Loan Term': loan_term,
        'Fund Date': datetime.datetime.combine(fund_date, datetime.time()),
        'Amount Requested': base_amount,
        'Amount Approved': amt_approved,
        'Amount Financed': amt_financed,
        'Loan Line Credit Limit': credit_limit,
        'Program': program,
        'Mailing Address': mailing_addr,
        'Mailing City': mailing_city,
        'Mailing State': mailing_state,
        'Mailing Zip': mailing_zip,
        'MD Loan': md_loan,
        'Month Key': month_key,
        'Year Key': year_key,
        'Occupancy Code': occupancy,
        'Originating Market Name': market,
        'Loan Originator Number': int(originator['id']),
        'Loan Originator Name': originator['name'],
        'Sales Reference Name': sales_ref['name'],
        'Policy Exceptions': policy_exc,
        'Policy Exceptions Reason': policy_reason,
        'Pricing Override': pricing_override,
        'Pricing Override Reason': pricing_reason,
        'Processor Name': processor,
        'Product Description': product_desc,
        'Product Number': product_num,
        'Property Type': property_type,
        'Region Name': region,
        'Report Market': report_market,
        'Residence Type': residence_type,
        'Total Sale Price': total_sale_price,
        'Total Applicants': total_applicants,
        'Underwriter Associate ID': int(underwriter['id']),
        'Underwriter Name': underwriter['name'],
        'Decision Date': datetime.datetime.combine(decision_date, datetime.time()),
        'Existing Lien Balances': existing_liens,
        'Client Status': client_status,
    }


# ── Generate in batches ───────────────────────────────────────────────────────
print(f"Generating {NUM_RECORDS:,} records...")

BATCH_SIZE = 10_000
all_batches = []

for batch_start in range(0, NUM_RECORDS, BATCH_SIZE):
    batch_end = min(batch_start + BATCH_SIZE, NUM_RECORDS)
    batch = [build_row(i) for i in range(batch_start, batch_end)]
    all_batches.append(pd.DataFrame(batch))
    if (batch_start // BATCH_SIZE + 1) % 5 == 0:
        print(f"  Generated {batch_end:,} / {NUM_RECORDS:,} rows...")

print("Concatenating batches...")
df = pd.concat(all_batches, ignore_index=True)
print(f"DataFrame shape: {df.shape}")

print(f"Writing to {OUTPUT_PATH} ...")
with pd.ExcelWriter(OUTPUT_PATH, engine='xlsxwriter', datetime_format='yyyy-mm-dd') as writer:
    df.to_excel(writer, sheet_name='Sheet1', index=False)
    workbook = writer.book
    worksheet = writer.sheets['Sheet1']
    header_fmt = workbook.add_format({'bold': True, 'bg_color': '#D9E1F2', 'border': 1})
    for col_num, col_name in enumerate(df.columns):
        worksheet.write(0, col_num, col_name, header_fmt)
        max_len = max(len(str(col_name)), df[col_name].astype(str).str.len().max())
        worksheet.set_column(col_num, col_num, min(max_len + 2, 30))

print(f"Done! File saved: {OUTPUT_PATH}")
print(f"Total records: {len(df):,}")
